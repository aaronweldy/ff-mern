import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const functionsDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
const workspaceTypesDirectory = join(functionsDirectory, "..", "ff-types");
const vendoredTypesDirectory = join(functionsDirectory, "vendor", "ff-types");

await mkdir(vendoredTypesDirectory, { recursive: true });
await Promise.all([
  cp(
    join(workspaceTypesDirectory, "index.js"),
    join(vendoredTypesDirectory, "index.js")
  ),
  cp(
    join(workspaceTypesDirectory, "index.d.ts"),
    join(vendoredTypesDirectory, "index.d.ts")
  ),
]);

const sourcePackage = JSON.parse(
  await readFile(join(workspaceTypesDirectory, "package.json"), "utf8")
);
const packageForFunctions = {
  name: sourcePackage.name,
  version: sourcePackage.version,
  description: sourcePackage.description,
  type: "module",
  main: "index.js",
  types: "index.d.ts",
  private: true,
  dependencies: {
    uuid: sourcePackage.dependencies.uuid,
  },
};
await writeFile(
  join(vendoredTypesDirectory, "package.json"),
  JSON.stringify(packageForFunctions, null, 2) + "\n"
);
