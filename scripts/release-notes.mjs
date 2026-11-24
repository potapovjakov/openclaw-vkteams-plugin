import { readFileSync } from "node:fs";

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), "utf8");
const { version } = JSON.parse(read("package.json"));
const lines = read("CHANGELOG.md").split(/\r?\n/);
const start = lines.findIndex((line) => line.trimEnd() === `## ${version}`);
const end = lines.findIndex((line, index) => index > start && line.startsWith("## "));
const notes = start === -1 ? "" : lines.slice(start + 1, end === -1 ? undefined : end).join("\n").trim();

if (!notes) {
  console.error(`Add a non-empty ## ${version} section to CHANGELOG.md.`);
  process.exit(1);
}

console.log(notes);
