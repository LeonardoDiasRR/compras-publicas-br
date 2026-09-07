import { spawnSync } from "node:child_process";

// ponytail: env inline em script npm não é cross-platform; spawn com env explícito resolve sem cross-env
const result = spawnSync(
  process.execPath,
  ["node_modules/vitest/vitest.mjs", "run", "test/e2e_cli.test.ts", "test/e2e_mcp_stdio.test.ts"],
  { stdio: "inherit", env: { ...process.env, RUN_LIVE_TESTS: "1" } },
);
process.exit(result.status ?? 1);
