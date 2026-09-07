import { getAdapter, supportedAgentIds } from "./adaptadores.js";
import { resolveScope } from "./escopo.js";
import { InstallerService } from "./instalador.js";
import {
  ConfigConflictError,
  ConfigFormatError,
  type OperationResult,
  PluginError,
  type ScopeName,
} from "./modelo.js";
import { installedVersion, latestStableVersion } from "./versoes.js";

type Operation = "install" | "update" | "uninstall";

const OPERATIONS: Operation[] = ["install", "update", "uninstall"];
const SCOPES: ScopeName[] = ["project", "user"];

const USAGE = "usage: cli.py [-h] {install,update,uninstall} ...";

function printHelp(): void {
  process.stdout.write(
    `${USAGE}\n\nManage the MCP plugin configuration\n\n` +
      "positional arguments:\n" +
      "  {install,update,uninstall}\n" +
      "    install             install the plugin\n" +
      "    update              update the plugin\n" +
      "    uninstall           uninstall the plugin\n\n" +
      "options:\n" +
      "  -h, --help            show this help message and exit\n"
  );
}

function argparseError(message: string): void {
  process.stderr.write(`${USAGE}\n`);
  process.stderr.write(`cli.py: error: ${message}\n`);
}

interface Args {
  operation: Operation;
  agent: string;
  scope: ScopeName;
}

type ParseResult = { kind: "ok"; args: Args } | { kind: "help" } | { kind: "error" };

function _isOption(token: string): boolean {
  return token.startsWith("-") && token.length > 1;
}

// argparse supports --opt=value for every option (same replica convention as catalogo.ts).
// ponytail: no argparse abbreviation matching (--ag → --agent); nothing in the repo relies on it.
function _parseArgs(argv: string[]): ParseResult {
  const fail = (message: string): ParseResult => {
    argparseError(message);
    return { kind: "error" };
  };
  const command = argv[0];
  if (command === "-h" || command === "--help") {
    printHelp();
    return { kind: "help" };
  }
  if (command === undefined) {
    return fail("the following arguments are required: {install,update,uninstall}");
  }
  if (!OPERATIONS.includes(command as Operation)) {
    return fail(
      `argument {install,update,uninstall}: invalid choice: '${command}' ` +
        "(choose from install, update, uninstall)"
    );
  }
  const operation = command as Operation;

  let agent: string | null = null;
  let scope: ScopeName = "project";
  const extras: string[] = [];
  // Subparser: unknown tokens (with their values) accumulate into parse_args' extras.
  for (let i = 1; i < argv.length; i++) {
    let token = argv[i] as string;
    let joinedValue: string | null = null;
    if (token.startsWith("--") && token.includes("=") && ["--agent", "--scope"].includes(token.slice(0, token.indexOf("=")))) {
      joinedValue = token.slice(token.indexOf("=") + 1);
      token = token.slice(0, token.indexOf("="));
    }
    if (token === "-h" || token === "--help") {
      printHelp();
      return { kind: "help" };
    } else if (token === "--agent" || token === "--scope") {
      if (joinedValue === null && (i + 1 >= argv.length || _isOption(argv[i + 1] as string))) {
        return fail(`argument ${token}: expected one argument`);
      }
      const value = joinedValue ?? (argv[++i] as string);
      if (token === "--agent") {
        if (!supportedAgentIds().includes(value as never)) {
          return fail(
            `argument --agent: invalid choice: '${value}' ` +
              `(choose from ${supportedAgentIds().join(", ")})`
          );
        }
        agent = value;
      } else {
        if (!SCOPES.includes(value as ScopeName)) {
          return fail(`argument --scope: invalid choice: '${value}' (choose from project, user)`);
        }
        scope = value as ScopeName;
      }
    } else if (_isOption(token)) {
      extras.push(token);
      if (i + 1 < argv.length && !_isOption(argv[i + 1] as string)) extras.push(argv[++i] as string);
    } else {
      extras.push(token);
    }
  }
  if (extras.length > 0) return fail(`unrecognized arguments: ${extras.join(" ")}`);
  if (agent === null) return fail("the following arguments are required: --agent");
  return { kind: "ok", args: { operation, agent, scope } };
}

function _printResult(agent: string, scope: ScopeName, result: OperationResult): void {
  // Python print() of str(bool) → "True"/"False"; the ported test asserts the python rendering.
  const changed = result.changed ? "True" : "False";
  const warnings = result.warnings.length > 0 ? result.warnings.join(", ") : "none";
  process.stdout.write(
    `agent: ${agent}\n` +
      `scope: ${scope}\n` +
      `config_path: ${result.configPath}\n` +
      `skill_path: ${result.skillPath}\n` +
      `version: ${result.version}\n` +
      `changed: ${changed}\n` +
      `warnings: ${warnings}\n`
  );
}

export async function runOperation(options: {
  operation: Operation;
  agent: string;
  scope: ScopeName;
  start?: string;
}): Promise<OperationResult> {
  const resolvedScope = resolveScope(options.scope, options.start ?? process.cwd());
  const adapter = getAdapter(options.agent);
  const versionResolver = options.operation === "update" ? latestStableVersion : installedVersion;
  const service = new InstallerService(adapter, resolvedScope, versionResolver);
  const result = await service[options.operation]();
  _printResult(adapter.agentId, options.scope, result);
  return result;
}

export async function main(argv: string[]): Promise<number> {
  const parsed = _parseArgs(argv);
  if (parsed.kind === "help") return 0;
  if (parsed.kind === "error") return 2;

  try {
    const result = await runOperation(parsed.args);
    if (result.warnings.some((warning) => warning.includes("Conflict preserved"))) return 3;
  } catch (error) {
    if (error instanceof ConfigFormatError || error instanceof ConfigConflictError) {
      process.stderr.write(`ERROR: ${errorMessage(error)}\n`);
      return 3;
    }
    if (error instanceof PluginError) {
      process.stderr.write(`ERROR: ${errorMessage(error)}\n`);
      return 4;
    }
    // ponytail: OSError/ValueError have no TS class equivalent; unknown-agent is already
    // rejected by the --agent choices check (exit 2), so only PluginError needs explicit 4.
    process.stderr.write(`ERROR: ${errorMessage(error)}\n`);
    return 4;
  }
  return 0;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
