import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

type Language = "ts" | "js";

interface CreateProjectOptions {
  projectName: string;
  language: Language;
  features: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(target[key])) {
      deepMerge(target[key] as Record<string, unknown>, value);
      continue;
    }

    target[key] = value;
  }
}

async function listFiles(root: string) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}

async function applyFeature(
  targetPath: string,
  language: Language,
  featureName: string,
) {
  const templatesDir = await resolveTemplatesDir();
  const featurePath = path.join(templatesDir, "features", featureName);
  const featureFilesPath = path.join(featurePath, "files", language);
  const featurePatchesPath = path.join(featurePath, "patches");

  if (await fs.pathExists(featureFilesPath)) {
    await fs.copy(featureFilesPath, targetPath, { overwrite: true });
  }

  if (await fs.pathExists(featurePatchesPath)) {
    const patchFiles = await listFiles(featurePatchesPath);

    for (const patchFile of patchFiles) {
      const relativePath = path.relative(featurePatchesPath, patchFile);
      const targetFile = path.join(targetPath, relativePath);
      const patchData = await fs.readJson(patchFile);
      const targetData = (await fs.pathExists(targetFile))
        ? await fs.readJson(targetFile)
        : {};

      if (!isPlainObject(targetData) || !isPlainObject(patchData)) {
        throw new Error(`Patch file "${relativePath}" must contain a JSON object`);
      }

      deepMerge(targetData, patchData);
      await fs.outputJson(targetFile, targetData, { spaces: 2 });
    }
  }
}

export async function createProject({
  projectName,
  language,
  features,
}: CreateProjectOptions) {
  const templatesDir = await resolveTemplatesDir();
  const templatePath = path.join(templatesDir, "base", language);
  const cwd = process.env.INIT_CWD || process.cwd();
  const targetPath = path.resolve(cwd, projectName);

  if (await fs.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }

  await fs.copy(templatePath, targetPath);

  for (const feature of features) {
    await applyFeature(targetPath, language, feature);
  }
}

async function resolveTemplatesDir() {
  const candidates = [
    path.resolve(__dirname, "..", "..", "templates"),
    path.resolve(__dirname, "..", "templates"),
  ];

  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error("Templates directory not found");
}
