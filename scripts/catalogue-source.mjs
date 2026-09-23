import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
// Read the existing repository catalogue without importing browser image modules.
// Only this trusted, checked-in source file is evaluated.
const source = readFileSync(new URL("../src/lib/products.ts", import.meta.url), "utf8").replace(
  /^import (\w+) from "@\/assets\/(.+)";$/gm,
  (_, name, file) => `const ${name} = ${JSON.stringify(file)};`,
);
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleExports = {};
runInNewContext(compiled, { exports: moduleExports, Intl }, { timeout: 1000 });
export const catalogue = moduleExports.products;
