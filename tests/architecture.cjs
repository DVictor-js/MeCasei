const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const item = path.join(directory,entry.name);
    return entry.isDirectory() ? files(item) : [item];
  });
}

test("Expo routes stay thin and Views cannot bypass ViewModels for data access", () => {
  for (const file of files("app")) {
    const source = fs.readFileSync(file,"utf8");
    assert.ok(source.split("\n").length <= 40,file);
    assert.doesNotMatch(source, /useState|useEffect|useSQLiteContext|fetch\(|core\/(api|database|sync)/,file);
  }
  const views = files("src/features").filter(file => file.includes(`${path.sep}view${path.sep}`));
  for (const file of [...views,...files("src/shared/components")]) {
    const source = fs.readFileSync(file,"utf8");
    assert.doesNotMatch(source, /\bfetch\(|getAllAsync|runAsync|useSQLiteContext|core\/sync\//,file);
    assert.doesNotMatch(source,/import\s+\{[^}]*\}\s+from\s+"[^"\n]*(Service|core\/database\/repository)"/,file);
  }
});
