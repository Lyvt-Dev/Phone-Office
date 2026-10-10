import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const entries = [];
for (const location of Object.keys(lock.packages)
  .filter(
    (p) =>
      p.startsWith("node_modules/") &&
      !lock.packages[p].os &&
      !lock.packages[p].cpu,
  )
  .sort()) {
  let pkg;
  try {
    pkg = JSON.parse(await readFile(join(location, "package.json"), "utf8"));
  } catch (e) {
    if (e.code === "ENOENT" && lock.packages[location].optional) continue;
    throw e;
  }
  const files = (await readdir(location))
    .filter((n) => /^(license|licence|copying|notice)(\.|$)/i.test(n))
    .sort();
  const texts = [];
  for (const file of files) {
    try {
      texts.push(`${file}\n${await readFile(join(location, file), "utf8")}`);
    } catch (e) {
      if (e.code !== "EISDIR") throw e;
    }
  }
  entries.push(
    `${pkg.name}@${pkg.version}\nDeclared license: ${typeof pkg.license === "string" ? pkg.license : JSON.stringify(pkg.license || "See upstream package")}\n${texts.join("\n\n")}`,
  );
}
const font = await readFile("public/fonts/OFL-Manrope.txt", "utf8");
await writeFile(
  "public/third-party-notices.txt",
  `Phone Office — third-party notices\nCreator: Lyvt\n\nThis inventory includes platform-independent installed build/test dependencies as well as app dependencies. Platform-specific native build tools are excluded; they are not bundled in the mobile web app. Their respective licenses apply to the third-party components. It does not grant a license to Phone Office itself.\n\nManrope font\n${font}\n\n${entries.join("\n\n----------------------------------------\n\n")}`,
);
console.log(
  `License notices generated for ${entries.length} installed packages and Manrope.`,
);
