const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

const manifestPath = path.join(
  __dirname,
  "../dist/extension-tracker-scan/browser/manifest.json"
);
if (!fs.existsSync(manifestPath)) {
  console.error("manifest.json introuvable. Vérifiez le chemin.");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const version = manifest.version;

const zip = new AdmZip();
const sourceDir = path.join(
  __dirname,
  "../dist/extension-tracker-scan/browser"
);
zip.addLocalFolder(sourceDir);

const outputFileName = `Extension_${version}.zip`;
const outputPath = path.join(__dirname, "../", outputFileName);

zip.writeZip(outputPath);
console.log(`Archive créée à la racine du projet : ${outputFileName}`);
