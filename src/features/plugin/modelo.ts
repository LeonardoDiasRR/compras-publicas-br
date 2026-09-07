export type AgentId =
  | "claude-code"
  | "codex"
  | "opencode"
  | "deepseek-harness"
  | "pi"
  | "antigravity"
  | "cursor"
  | "hermes-agent"
  | "openclaw"
  | "generic";

export type ScopeName = "project" | "user";

export interface ScopeTarget {
  readonly scope: ScopeName;
  readonly root: string;
  readonly usedGitRoot: boolean;
}

export interface McpRegistration {
  readonly command: string;
  readonly args: string[];
  readonly version: string;
  readonly managedPackage: string;
}

export interface OperationResult {
  readonly changed: boolean;
  readonly configPath: string;
  readonly skillPath: string;
  readonly version: string;
  readonly warnings: string[];
}

export class PluginError extends Error {}

export class ConfigConflictError extends PluginError {}

export class ConfigFormatError extends PluginError {}
