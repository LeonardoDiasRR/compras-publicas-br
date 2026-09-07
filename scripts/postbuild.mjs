import { cpSync, readFileSync, writeFileSync } from "node:fs";

const bin = "dist/index.js";
writeFileSync(bin, "#!/usr/bin/env node\n" + readFileSync(bin, "utf8"));
cpSync("src/features/plugin/templates", "dist/features/plugin/templates", { recursive: true });
