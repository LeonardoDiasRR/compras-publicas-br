import { chmodSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

import json5 from "json5";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";

import { ConfigFormatError } from "./modelo.js";

export type FormatName = "json" | "json5" | "toml";

type Mapping = Record<string, unknown>;

export function loadDocument(path: string, formatName: FormatName): Mapping {
  let document: unknown;
  try {
    const content = readFileSync(path, "utf-8");
    if (formatName === "json") {
      document = JSON.parse(content);
    } else if (formatName === "json5") {
      document = json5.parse(content);
    } else if (formatName === "toml") {
      document = parseToml(content);
    } else {
      throw new ConfigFormatError(`unsupported configuration format: ${formatName}`);
    }
  } catch (error) {
    if (error instanceof ConfigFormatError) {
      throw error;
    }
    throw new ConfigFormatError(`invalid ${formatName} configuration: ${path}`);
  }

  if (typeof document !== "object" || document === null || Array.isArray(document)) {
    throw new ConfigFormatError(`configuration root must be a mapping: ${path}`);
  }
  return document as Mapping;
}

function deepEquals(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEquals(item, b[index]));
  }
  if (
    typeof a === "object" && a !== null && !Array.isArray(a) &&
    typeof b === "object" && b !== null && !Array.isArray(b)
  ) {
    const left = a as Mapping;
    const right = b as Mapping;
    const leftKeys = Object.keys(left);
    return (
      leftKeys.length === Object.keys(right).length &&
      leftKeys.every((key) => key in right && deepEquals(left[key], right[key]))
    );
  }
  return false;
}

function findContainer(
  document: Mapping,
  containerPath: readonly string[],
  createMissing: boolean,
): Mapping | null {
  let current: Mapping = document;
  for (const key of containerPath) {
    if (!(key in current)) {
      if (!createMissing) {
        return null;
      }
      current[key] = {};
    }
    const value = current[key];
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      current = value as Mapping;
    } else {
      return null;
    }
  }
  return current;
}

export function mergeMcpEntry(
  document: Mapping,
  containerPath: readonly string[],
  name: string,
  entry: Mapping,
  owns: (value: unknown) => boolean,
): [Mapping, boolean] {
  const container = findContainer(document, containerPath, true);
  if (container === null) {
    return [document, false];
  }

  const current = container[name];
  if (!(name in container)) {
    container[name] = entry;
    return [document, true];
  }
  if (owns(current)) {
    if (deepEquals(current, entry)) {
      return [document, false];
    }
    container[name] = entry;
    return [document, true];
  }
  return [document, false];
}

export function removeMcpEntry(
  document: Mapping,
  containerPath: readonly string[],
  name: string,
  owns: (value: unknown) => boolean,
): [Mapping, boolean] {
  const container = findContainer(document, containerPath, false);
  if (container === null || !(name in container)) {
    return [document, false];
  }
  if (!owns(container[name])) {
    return [document, false];
  }
  delete container[name];
  return [document, true];
}

export function dumpDocument(document: Mapping, formatName: FormatName): string {
  if (formatName === "json") {
    return `${JSON.stringify(document, null, 2)}\n`;
  }
  if (formatName === "json5") {
    return `${json5.stringify(document, null, 2)}\n`;
  }
  if (formatName === "toml") {
    return stringifyToml(document);
  }
  throw new ConfigFormatError(`unsupported configuration format: ${formatName}`);
}

export function atomicWrite(path: string, content: string): void {
  // ponytail: no fsync; single-user CLI config files, renameSync is already
  // atomic on the same volume.
  const temporaryPath = join(
    dirname(path),
    `.${basename(path)}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`,
  );
  try {
    let existingMode: number | null = null;
    try {
      existingMode = statSync(path).mode & 0o777;
    } catch {
      // FileNotFoundError equivalent: file does not exist yet
    }

    writeFileSync(temporaryPath, content, "utf-8");
    if (existingMode !== null) {
      chmodSync(temporaryPath, existingMode);
    }
    renameSync(temporaryPath, path);
  } finally {
    rmSync(temporaryPath, { force: true });
  }
}
