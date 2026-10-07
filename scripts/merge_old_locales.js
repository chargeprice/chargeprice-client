// Cached (old) versions of the web app still request keys that were removed from the locales.
// Merges the removed keys from xx_old.json into xx.json in dist/, so these versions keep working.
const fs = require("fs");
const path = require("path");

const LOCALES_FOLDER = path.join(__dirname, "../dist/locales");

fs.readdirSync(LOCALES_FOLDER)
  .filter(file => file.endsWith("_old.json"))
  .forEach(oldFile => {
    const oldPath = path.join(LOCALES_FOLDER, oldFile);
    const currentPath = path.join(LOCALES_FOLDER, oldFile.replace("_old.json", ".json"));

    const old = JSON.parse(fs.readFileSync(oldPath));
    const current = JSON.parse(fs.readFileSync(currentPath));

    // Current translations always win
    fs.writeFileSync(currentPath, JSON.stringify({ ...old, ...current }, null, 2));
    fs.unlinkSync(oldPath);
  });
