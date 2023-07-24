import { readdirSync } from "fs";

export default async function importSubcommands(category, command) {
  const subcommands = {};
  const subFiles = readdirSync(`./commands/${category}/__${command}`);

  for (const subFile of subFiles) {
    if (!/\.js$/.test(subFile)) continue;

    const importedFile = await import(
      `../commands/${category}/__${command}/${subFile}`
    );

    Object.defineProperty(subcommands, subFile.replace(/\.js$/, ""), {
      value: importedFile.default,
      enumerable: true,
    });
  }

  return subcommands;
}
