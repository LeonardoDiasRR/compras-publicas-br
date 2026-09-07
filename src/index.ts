import { main as catalogoMain } from "./features/catalogo/catalogo.js";
import { main as servidorMain } from "./features/mcp/servidor.js";

const argv = process.argv.slice(2);
const command = argv[0];
if (command === "catalogo") {
  const code = await catalogoMain(argv.slice(1));
  if (code !== 0) process.exitCode = code;
} else {
  // ponytail: ramo `plugin` (./features/plugin/cli.js) entra na task 7.4
  await servidorMain(argv);
}
