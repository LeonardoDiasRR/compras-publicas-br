import { randomBytes } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";

import type { AgentAdapter, AgentTarget } from "./adaptadores.js";
import {
  atomicWrite,
  dumpDocument,
  loadDocument,
  mergeMcpEntry,
  removeMcpEntry,
} from "./armazenamento.js";
import { isManagedSkill, renderSkill } from "./habilidades.js";
import type { OperationResult, ScopeTarget } from "./modelo.js";

const ENTRY_NAME = "compras-publicas-br";
const MISSING = Symbol("missing");
const CONFLICT = Symbol("conflict");

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function pathExists(path: string): boolean {
  return existsSync(path) || isSymlink(path);
}

export type VersionResolver = () => string | Promise<string>;

export class InstallerService {
  private readonly _adapter: AgentAdapter;
  private readonly _scope: ScopeTarget;
  private readonly _versionResolver: VersionResolver;
  private readonly _target: AgentTarget;

  constructor(adapter: AgentAdapter, target: ScopeTarget, versionResolver: VersionResolver) {
    this._adapter = adapter;
    this._scope = target;
    this._versionResolver = versionResolver;
    this._target = adapter.resolveTarget(target);
    adapter.validateTarget(this._target);
  }

  async install(): Promise<OperationResult> {
    const version = await this._installedVersion();
    const entry = this._adapter.buildEntry(version);
    const [document, configExists] = this._readConfig();
    const existing = this._entry(document);
    if (
      existing === CONFLICT ||
      (existing !== MISSING && !this._adapter.ownsEntry(existing))
    ) {
      return this._result(false, version, [this._conflictWarning()]);
    }

    const [merged, configChanged] = mergeMcpEntry(
      document,
      this._target.containerPath,
      ENTRY_NAME,
      entry,
      (value: unknown) => this._adapter.ownsEntry(value)
    );
    const [skillContent, skillChanged, skillWarning] = this._plannedSkill();
    if (skillWarning !== null && !configChanged) {
      return this._result(false, version, [skillWarning]);
    }

    const configContent = dumpDocument(merged, this._target.configFormat);
    this._commit(
      configChanged || !configExists ? configContent : null,
      skillChanged ? skillContent : null
    );
    const warnings = skillWarning !== null ? [skillWarning] : [];
    return this._result(configChanged || skillChanged, version, warnings);
  }

  async update(): Promise<OperationResult> {
    const [document, configExists] = this._readConfig();
    const existing = this._entry(document);
    if (existing === CONFLICT) {
      return this._result(false, "", [this._conflictWarning()]);
    }
    if (existing === MISSING) {
      return this._result(false, "", ["No managed MCP entry was found."]);
    }
    if (!this._adapter.ownsEntry(existing)) {
      return this._result(false, "", [this._conflictWarning()]);
    }

    const version = await this._latestVersion();
    const canonicalEntry = this._adapter.buildEntry(version);
    const entry = this._updatePin(existing, canonicalEntry);
    const [merged, configChanged] = mergeMcpEntry(
      document,
      this._target.containerPath,
      ENTRY_NAME,
      entry,
      (value: unknown) => this._adapter.ownsEntry(value)
    );
    const [skillContent, skillChanged, skillWarning] = this._plannedSkill();
    const configContent = dumpDocument(merged, this._target.configFormat);
    this._commit(
      configChanged || !configExists ? configContent : null,
      skillChanged ? skillContent : null
    );
    const warnings = skillWarning !== null ? [skillWarning] : [];
    return this._result(configChanged || skillChanged, version, warnings);
  }

  async uninstall(): Promise<OperationResult> {
    const [document, configExists] = this._readConfig();
    const existing = this._entry(document);
    let managedEntry = existing !== MISSING && existing !== CONFLICT;
    if (managedEntry) {
      managedEntry = this._adapter.ownsEntry(existing);
    }
    const managedSkill = isManagedSkill(this._target.skillPath);
    const warnings: string[] = [];
    if (existing === CONFLICT || (existing !== MISSING && !managedEntry)) {
      warnings.push(this._conflictWarning());
    }
    if (this._hasUnmanagedSkill()) {
      warnings.push(this._unmanagedSkillWarning());
    }
    if (!managedEntry && !managedSkill) {
      warnings.push("No managed MCP entry or skill was found.");
    }
    const hasEntryConflict =
      existing === CONFLICT || (existing !== MISSING && !managedEntry);
    if (hasEntryConflict && !managedSkill) {
      return this._result(false, "", warnings);
    }

    const [removedDocument, configChanged] = removeMcpEntry(
      document,
      this._target.containerPath,
      ENTRY_NAME,
      (value: unknown) => this._adapter.ownsEntry(value)
    );
    const skillChanged = managedSkill;
    const version = this._entryVersion(existing);
    const configContent = dumpDocument(removedDocument, this._target.configFormat);
    this._commit(
      configChanged && configExists ? configContent : null,
      null,
      skillChanged
    );
    return this._result(configChanged || skillChanged, version, warnings);
  }

  private _readConfig(): [Record<string, unknown>, boolean] {
    const path = this._target.configPath;
    if (!existsSync(path)) {
      return [{}, false];
    }
    return [loadDocument(path, this._target.configFormat), true];
  }

  private _entry(document: Record<string, unknown>): unknown {
    let current: unknown = document;
    for (const key of this._target.containerPath) {
      const mapping = asRecord(current);
      if (mapping === null) return CONFLICT;
      if (!Object.hasOwn(mapping, key)) return MISSING;
      current = mapping[key];
    }
    const mapping = asRecord(current);
    if (mapping === null) return CONFLICT;
    return Object.hasOwn(mapping, ENTRY_NAME) ? mapping[ENTRY_NAME] : MISSING;
  }

  private _hasUnmanagedSkill(): boolean {
    const path = this._target.skillPath;
    return pathExists(path) && !isManagedSkill(path);
  }

  private _plannedSkill(): [string | null, boolean, string | null] {
    const path = this._target.skillPath;
    if (pathExists(path) && !isManagedSkill(path)) {
      return [null, false, `Unmanaged skill preserved: ${path}`];
    }
    const content = renderSkill(
      this._adapter.agentId,
      this._adapter.displayName,
      this._scope.scope
    );
    let unchanged: boolean;
    try {
      unchanged = readFileSync(path, "utf8") === content;
    } catch {
      unchanged = false;
    }
    return [content, !unchanged, null];
  }

  private _commit(
    configContent: string | null,
    skillContent: string | null,
    deleteSkill = false
  ): void {
    const target = this._target;
    const writes: [string, string][] = [];
    if (configContent !== null) writes.push([target.configPath, configContent]);
    if (skillContent !== null) writes.push([target.skillPath, skillContent]);
    const snapshotPaths = writes.map(([path]) => path);
    if (deleteSkill) snapshotPaths.push(target.skillPath);
    const snapshots = new Map(
      snapshotPaths.map((path) => [path, this._snapshot(path)] as const)
    );
    try {
      for (const [path] of writes) mkdirSync(dirname(path), { recursive: true });
      if (configContent !== null) atomicWrite(target.configPath, configContent);
      if (skillContent !== null) {
        atomicWrite(target.skillPath, skillContent);
      } else if (deleteSkill) {
        unlinkSync(target.skillPath);
      }
    } catch (error) {
      for (const [path, snapshot] of snapshots) this._restore(path, snapshot);
      throw error;
    }
  }

  private _snapshot(path: string): [boolean, Buffer | null] {
    const exists = pathExists(path);
    return [exists, exists ? readFileSync(path) : null];
  }

  private _restore(path: string, [existed, content]: [boolean, Buffer | null]): void {
    if (!existed) {
      rmSync(path, { force: true });
    } else if (content !== null) {
      atomicWrite(path, content.toString("utf8"));
      if (!readFileSync(path).equals(content)) this._restoreBytes(path, content);
    }
  }

  private _restoreBytes(path: string, content: Buffer): void {
    const tempPath = join(
      dirname(path),
      `.${basename(path)}.${randomBytes(8).toString("hex")}.tmp`
    );
    try {
      const fd = openSync(tempPath, "w");
      try {
        writeSync(fd, content);
        fsyncSync(fd);
      } finally {
        closeSync(fd);
      }
      renameSync(tempPath, path);
    } finally {
      rmSync(tempPath, { force: true });
    }
  }

  private async _installedVersion(): Promise<string> {
    return await Promise.resolve(this._versionResolver());
  }

  private async _latestVersion(): Promise<string> {
    return await Promise.resolve(this._versionResolver());
  }

  private _updatePin(
    existing: unknown,
    canonical: Record<string, unknown>
  ): Record<string, unknown> {
    const entry = structuredClone(existing) as Record<string, unknown>;
    const existingArgs = entry.args;
    const canonicalArgs = canonical.args;
    if (!Array.isArray(existingArgs) || !Array.isArray(canonicalArgs)) {
      return { ...canonical };
    }
    if (existingArgs.length < 2 || canonicalArgs.length < 2) {
      return { ...canonical };
    }
    existingArgs[1] = canonicalArgs[1];
    entry.args = existingArgs;
    return entry;
  }

  private _entryVersion(entry: unknown): string {
    const mapping = asRecord(entry);
    if (mapping !== null) {
      const args = mapping.args;
      if (!Array.isArray(args)) return "";
      if (args.length > 1 && typeof args[1] === "string") return args[1];
    }
    return "";
  }

  private _conflictWarning(): string {
    return `Conflict preserved for managed MCP entry in ${this._target.configPath}.`;
  }

  private _unmanagedSkillWarning(): string {
    return `Unmanaged skill preserved: ${this._target.skillPath}`;
  }

  private _result(
    changed: boolean,
    version: string,
    warnings: string[]
  ): OperationResult {
    return {
      changed: changed,
      configPath: this._target.configPath,
      skillPath: this._target.skillPath,
      version: version,
      warnings: warnings,
    };
  }
}
