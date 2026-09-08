import { join, resolve, relative, isAbsolute } from "node:path";

import type { AgentId, ScopeName, ScopeTarget } from "./modelo.js";
import { PluginError } from "./modelo.js";
import { localBinPath, PACKAGE_NAME, versionedCommand } from "./versoes.js";

export type ConfigFormat = "json" | "json5" | "toml";
export type EntryStyle = "generic" | "opencode" | "cursor" | "command_args";
export type McpEntry = Record<string, unknown>;

export interface AgentTarget {
  readonly configPath: string;
  readonly configFormat: ConfigFormat;
  readonly containerPath: readonly string[];
  readonly skillPath: string;
  readonly nativeAdd: readonly string[] | null;
  readonly nativeRemove: readonly string[] | null;
  readonly basePath: string;
}

export interface AgentAdapter {
  readonly agentId: AgentId;
  readonly displayName: string;
  readonly validationCommand: readonly string[] | null;
  resolveTarget(scope: ScopeTarget): AgentTarget;
  buildEntry(version: string): McpEntry;
  ownsEntry(value: unknown): boolean;
  validateTarget(target: AgentTarget): void;
}

function isMapping(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSequence(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, ...keys: string[]): boolean {
  const present = Object.keys(value);
  return (
    present.length === keys.length && keys.every((key) => Object.hasOwn(value, key))
  );
}

const STABLE_VERSION_RE = /^\d+\.\d+\.\d+(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

function parseStableVersion(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value !== value.trim()
  ) {
    throw new PluginError("package version must be a non-empty exact pin");
  }
  if (value.includes("-")) {
    throw new PluginError("package version must be stable");
  }
  if (!STABLE_VERSION_RE.test(value)) {
    throw new PluginError("invalid package version");
  }
  return value;
}

function isStablePin(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const prefix = `${PACKAGE_NAME}@`;
  if (!value.startsWith(prefix)) return false;
  try {
    parseStableVersion(value.slice(prefix.length));
  } catch {
    return false;
  }
  return true;
}

// duas formas possuídas: ["npx","-y",`${PACKAGE_NAME}@<stable>`] e
// ["node", <caminho do bin local>] escrita enquanto não publicado.
// ponytail: localBinPath() é null em vitest(src); forma node só é testada
// no e2e (roda do dist), onde ela é escrita de verdade.
function isLocalNodeCommand(command: unknown, args: unknown[]): boolean {
  const bin = localBinPath();
  return (
    command === "node" &&
    args.length === 1 &&
    typeof args[0] === "string" &&
    isAbsolute(args[0]) &&
    bin !== null &&
    resolve(args[0]).toLowerCase() === resolve(bin).toLowerCase()
  );
}

function ownsFullCommand(parts: unknown[]): boolean {
  if (parts.length === 3) {
    return parts[0] === "npx" && parts[1] === "-y" && isStablePin(parts[2]);
  }
  return parts.length === 2 && isLocalNodeCommand(parts[0], parts.slice(1));
}

function ownsArgs(args: unknown[], command: unknown): boolean {
  if (command === "npx") {
    return args.length === 2 && args[0] === "-y" && isStablePin(args[1]);
  }
  return isLocalNodeCommand(command, args);
}

function validParts(value: unknown, allowNone = false): boolean {
  if (value === null || value === undefined) return value === null && allowNone;
  if (!Array.isArray(value)) return false;
  return value.length > 0 && value.every((part) => typeof part === "string" && part !== "");
}

function validatePath(targetPath: unknown, basePath: string): void {
  if (typeof targetPath !== "string" || targetPath.length === 0) {
    throw new PluginError("invalid target path");
  }
  if (targetPath.split(/[/\\]+/).includes("..")) {
    throw new PluginError(`unsafe target path: ${targetPath}`);
  }
  const resolvedPath = resolve(targetPath);
  const relativePath = relative(basePath, resolvedPath);
  const inside =
    relativePath === "" ||
    (!relativePath.startsWith("..") && !isAbsolute(relativePath));
  if (!inside) {
    throw new PluginError(`target path is outside base path: ${targetPath}`);
  }
}

interface AdapterSpec {
  agentId: AgentId;
  displayName: string;
  projectConfig: readonly string[];
  userConfig: readonly string[];
  configFormat: ConfigFormat;
  projectSkill: readonly string[];
  userSkill: readonly string[];
  containerPath: readonly string[];
  nativeAdd?: readonly string[] | null;
  nativeRemove?: readonly string[] | null;
  validationCommand?: readonly string[] | null;
  entryStyle?: EntryStyle;
}

class Adapter implements AgentAdapter {
  readonly agentId: AgentId;
  readonly displayName: string;
  // ponytail: validationCommand nunca executado (igual ao python — só metadado)
  readonly validationCommand: readonly string[] | null;
  private readonly spec: AdapterSpec;
  private readonly entryStyle: EntryStyle;

  constructor(spec: AdapterSpec) {
    this.spec = spec;
    this.agentId = spec.agentId;
    this.displayName = spec.displayName;
    this.validationCommand = spec.validationCommand ?? null;
    this.entryStyle = spec.entryStyle ?? "command_args";
  }

  resolveTarget(scope: ScopeTarget): AgentTarget {
    const scopeName: ScopeName = scope.scope;
    if (scopeName !== "project" && scopeName !== "user") {
      throw new PluginError(`unknown scope: ${String(scopeName)}`);
    }
    const base = resolve(scope.root);
    const configParts =
      scopeName === "project" ? this.spec.projectConfig : this.spec.userConfig;
    const skillParts =
      scopeName === "project" ? this.spec.projectSkill : this.spec.userSkill;
    return {
      configPath: join(base, ...configParts),
      configFormat: this.spec.configFormat,
      containerPath: this.spec.containerPath,
      skillPath: join(base, ...skillParts),
      nativeAdd: this.spec.nativeAdd ?? null,
      nativeRemove: this.spec.nativeRemove ?? null,
      basePath: base,
    };
  }

  buildEntry(version: string): McpEntry {
    parseStableVersion(version);
    const command = versionedCommand(version);
    if (this.entryStyle === "generic") {
      return {
        command: command[0],
        args: command.slice(1),
        managedBy: { package: PACKAGE_NAME, schemaVersion: 1 },
      };
    }
    if (this.entryStyle === "opencode") {
      return { type: "local", command: command };
    }
    if (this.entryStyle === "cursor") {
      return { type: "stdio", command: command[0], args: command.slice(1) };
    }
    return { command: command[0], args: command.slice(1) };
  }

  ownsEntry(value: unknown): boolean {
    if (!isMapping(value)) return false;
    const entry = value;
    if (this.entryStyle === "opencode") {
      if (!hasExactKeys(entry, "type", "command")) return false;
      if (entry["type"] !== "local") return false;
      const rawCommand = entry["command"];
      if (!isSequence(rawCommand)) return false;
      return ownsFullCommand(rawCommand);
    }

    if (this.entryStyle === "cursor") {
      if (!hasExactKeys(entry, "type", "command", "args")) return false;
      if (entry["type"] !== "stdio") return false;
      const rawArgs = entry["args"];
      if (!isSequence(rawArgs)) return false;
      return ownsArgs(rawArgs, entry["command"]);
    }

    const expectedKeys =
      this.entryStyle === "generic"
        ? (["command", "args", "managedBy"] as const)
        : (["command", "args"] as const);
    if (!hasExactKeys(entry, ...expectedKeys)) {
      return false;
    }
    const rawArgs = entry["args"];
    if (!isSequence(rawArgs)) return false;
    if (!ownsArgs(rawArgs, entry["command"])) return false;
    if (this.entryStyle !== "generic") return true;
    const managedBy = entry["managedBy"];
    if (!isMapping(managedBy)) return false;
    return (
      hasExactKeys(managedBy, "package", "schemaVersion") &&
      managedBy["package"] === PACKAGE_NAME &&
      managedBy["schemaVersion"] === 1
    );
  }

  validateTarget(target: AgentTarget): void {
    const configFormat: unknown = target.configFormat;
    if (configFormat !== "json" && configFormat !== "json5" && configFormat !== "toml") {
      throw new PluginError(`unsupported configuration format: ${String(configFormat)}`);
    }
    if (typeof target.basePath !== "string" || target.basePath.length === 0) {
      throw new PluginError("invalid target base path");
    }
    const basePath = resolve(target.basePath);
    validatePath(target.configPath, basePath);
    validatePath(target.skillPath, basePath);
    if (!validParts(target.containerPath)) {
      throw new PluginError("invalid configuration container path");
    }
    for (const command of [target.nativeAdd, target.nativeRemove]) {
      if (!validParts(command, true)) {
        throw new PluginError("invalid native command");
      }
    }
  }
}

function skill(...parts: string[]): string[] {
  return [...parts, "SKILL.md"];
}

const REGISTRY: ReadonlyMap<string, AgentAdapter> = new Map<string, AgentAdapter>(
  [
    // https://code.claude.com/docs/en/mcp and https://code.claude.com/docs/en/skills
    [
      "claude-code",
      new Adapter({
        agentId: "claude-code",
        displayName: "Claude Code",
        projectConfig: [".mcp.json"],
        userConfig: [".claude.json"],
        configFormat: "json",
        projectSkill: skill(".claude", "skills", PACKAGE_NAME),
        userSkill: skill(".claude", "skills", PACKAGE_NAME),
        containerPath: ["mcpServers"],
        nativeAdd: ["claude", "mcp", "add"],
        nativeRemove: ["claude", "mcp", "remove"],
        validationCommand: ["claude", "mcp", "list"],
      }),
    ],
    // https://developers.openai.com/codex/mcp and https://developers.openai.com/codex/skills
    [
      "codex",
      new Adapter({
        agentId: "codex",
        displayName: "Codex",
        projectConfig: [".codex", "config.toml"],
        userConfig: [".codex", "config.toml"],
        configFormat: "toml",
        projectSkill: skill(".agents", "skills", PACKAGE_NAME),
        userSkill: skill(".agents", "skills", PACKAGE_NAME),
        containerPath: ["mcp_servers"],
        nativeAdd: ["codex", "mcp", "add"],
        nativeRemove: ["codex", "mcp", "remove"],
        validationCommand: ["codex", "mcp", "list"],
      }),
    ],
    // https://opencode.ai/docs/mcp-servers/ and https://opencode.ai/docs/skills/
    [
      "opencode",
      new Adapter({
        agentId: "opencode",
        displayName: "OpenCode",
        projectConfig: ["opencode.json"],
        userConfig: [".config", "opencode", "opencode.json"],
        configFormat: "json",
        projectSkill: skill(".opencode", "skills", PACKAGE_NAME),
        userSkill: skill(".config", "opencode", "skills", PACKAGE_NAME),
        containerPath: ["mcp"],
        entryStyle: "opencode",
      }),
    ],
    // https://deepseek-harness.github.io/deepseek-harness/
    [
      "deepseek-harness",
      new Adapter({
        agentId: "deepseek-harness",
        displayName: "DeepSeek Harness",
        projectConfig: [".dsh", "config.json"],
        userConfig: [".dsh", "config.json"],
        configFormat: "json",
        projectSkill: skill(".agents", "skills", PACKAGE_NAME),
        userSkill: skill(".agents", "skills", PACKAGE_NAME),
        containerPath: ["mcpServers"],
      }),
    ],
    // https://pi.dev/docs/latest/settings and https://pi.dev/docs/latest/skills
    [
      "pi",
      new Adapter({
        agentId: "pi",
        displayName: "Pi",
        projectConfig: [".pi", "settings.json"],
        userConfig: [".pi", "agent", "settings.json"],
        configFormat: "json",
        projectSkill: skill(".pi", "skills", PACKAGE_NAME),
        userSkill: skill(".pi", "agent", "skills", PACKAGE_NAME),
        containerPath: ["mcpServers"],
      }),
    ],
    // https://antigravity.google/docs/mcp
    [
      "antigravity",
      new Adapter({
        agentId: "antigravity",
        displayName: "Antigravity",
        projectConfig: [".agents", "mcp_config.json"],
        userConfig: [".gemini", "config", "mcp_config.json"],
        configFormat: "json",
        projectSkill: skill(".agents", "skills", PACKAGE_NAME),
        userSkill: skill(".gemini", "config", "skills", PACKAGE_NAME),
        containerPath: ["mcpServers"],
      }),
    ],
    // https://cursor.com/docs/context/mcp and https://cursor.com/docs/context/skills
    [
      "cursor",
      new Adapter({
        agentId: "cursor",
        displayName: "Cursor",
        projectConfig: [".cursor", "mcp.json"],
        userConfig: [".cursor", "mcp.json"],
        configFormat: "json",
        projectSkill: skill(".cursor", "skills", PACKAGE_NAME),
        userSkill: skill(".cursor", "skills", PACKAGE_NAME),
        containerPath: ["mcpServers"],
        entryStyle: "cursor",
      }),
    ],
    // https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
    // https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
    [
      "hermes-agent",
      new Adapter({
        agentId: "hermes-agent",
        displayName: "Hermes Agent",
        projectConfig: [".hermes", "config.json5"],
        userConfig: [".hermes", "config.json5"],
        configFormat: "json5",
        projectSkill: skill(".hermes", "skills", PACKAGE_NAME),
        userSkill: skill(".hermes", "skills", PACKAGE_NAME),
        containerPath: ["mcp_servers"],
      }),
    ],
    // https://docs.openclaw.ai/tools/mcp and https://docs.openclaw.ai/tools/skills
    [
      "openclaw",
      new Adapter({
        agentId: "openclaw",
        displayName: "OpenClaw",
        projectConfig: [".openclaw", "openclaw.json"],
        userConfig: [".openclaw", "openclaw.json"],
        configFormat: "json5",
        projectSkill: skill("skills", PACKAGE_NAME),
        userSkill: skill(".openclaw", "skills", PACKAGE_NAME),
        containerPath: ["mcp", "servers"],
        nativeAdd: ["openclaw", "mcp", "add"],
        nativeRemove: ["openclaw", "mcp", "unset"],
        validationCommand: ["openclaw", "mcp", "list"],
      }),
    ],
    [
      "generic",
      new Adapter({
        agentId: "generic",
        displayName: "Generic Agent",
        projectConfig: [".agent", "mcp.json"],
        userConfig: [".agent", "mcp.json"],
        configFormat: "json",
        projectSkill: [".agent", "skills", "compras-publicas-br.md"],
        userSkill: [".agent", "skills", "compras-publicas-br.md"],
        containerPath: ["mcpServers"],
        entryStyle: "generic",
      }),
    ],
  ],
);

export function getAdapter(agentId: string): AgentAdapter {
  const adapter = REGISTRY.get(agentId);
  if (adapter === undefined) {
    throw new PluginError(`unknown agent: ${agentId}`);
  }
  return adapter;
}

export function supportedAgentIds(): AgentId[] {
  return [...REGISTRY.keys()] as AgentId[];
}
