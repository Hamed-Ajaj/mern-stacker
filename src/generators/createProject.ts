import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

type Language = "ts" | "js";
type ProjectStructure = "standard" | "monorepo";

interface CreateProjectOptions {
  projectName: string;
  language: Language;
  features: string[];
  structure: ProjectStructure;
  packageManager: "pnpm" | "npm" | "bun";
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
  structure: ProjectStructure,
) {
  const templatesDir = await resolveTemplatesDir();
  const featurePath = path.join(templatesDir, "features", featureName);
  const featureFilesPath = path.join(featurePath, "files", language);
  const featurePatchesPath = path.join(featurePath, "patches");

  if (await fs.pathExists(featureFilesPath)) {
    const files = await listFiles(featureFilesPath);

    for (const filePath of files) {
      const relativePath = path.relative(featureFilesPath, filePath);
      const mappedPath = mapFeaturePath(relativePath, structure, featureName);
      const targetFile = path.join(targetPath, mappedPath);
      await fs.copy(filePath, targetFile, { overwrite: true });
    }
  }

  if (await fs.pathExists(featurePatchesPath)) {
    const patchFiles = await listFiles(featurePatchesPath);

    for (const patchFile of patchFiles) {
      const relativePath = path.relative(featurePatchesPath, patchFile);
      const mappedPath = mapFeaturePath(relativePath, structure, featureName);
      const targetFile = path.join(targetPath, mappedPath);
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
  structure,
  packageManager,
}: CreateProjectOptions) {
  const templatesDir = await resolveTemplatesDir();
  const templatePath = path.join(templatesDir, "base", language);
  const cwd = process.env.INIT_CWD || process.cwd();
  const targetPath = path.resolve(cwd, projectName);

  if (structure === "monorepo" && language !== "ts") {
    throw new Error("Monorepo mode requires TypeScript.");
  }

  if (await fs.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }

  if (structure === "monorepo") {
    await createMonorepoTemplate({
      targetPath,
      templatesDir,
      projectName,
      packageManager,
    });
  } else {
    await fs.copy(templatePath, targetPath);
  }

  for (const feature of features) {
    await applyFeature(targetPath, language, feature, structure);
  }

  if (features.includes("router-tanstack")) {
    const appFile = language === "ts" ? "App.tsx" : "App.jsx";
    const clientRoot =
      structure === "monorepo" ? path.join("apps", "web") : "client";
    await fs.remove(path.join(targetPath, clientRoot, "src", appFile));
  }

  if (structure === "monorepo") {
    await configureMonorepoPackages(targetPath);
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

function mapFeaturePath(
  relativePath: string,
  structure: ProjectStructure,
  featureName: string,
) {
  if (structure !== "monorepo") {
    return relativePath;
  }

  const normalized = relativePath.split(path.sep).join("/");

  if (
    featureName === "zod" &&
    (normalized.startsWith("client/") || normalized.startsWith("server/"))
  ) {
    return path
      .join(
        "packages",
        "shared",
        normalized.replace(/^(client|server)\//, ""),
      )
      .replace(/\\/g, path.sep);
  }

  if (normalized.startsWith("client/")) {
    return path
      .join("apps", "web", normalized.replace(/^client\//, ""))
      .replace(/\\/g, path.sep);
  }

  if (normalized.startsWith("server/")) {
    return path
      .join("apps", "api", normalized.replace(/^server\//, ""))
      .replace(/\\/g, path.sep);
  }

  return relativePath;
}

async function createMonorepoTemplate({
  targetPath,
  templatesDir,
  projectName,
  packageManager,
}: {
  targetPath: string;
  templatesDir: string;
  projectName: string;
  packageManager: "pnpm" | "npm" | "bun";
}) {
  const baseTsPath = path.join(templatesDir, "base", "ts");

  await fs.ensureDir(targetPath);
  await fs.ensureDir(path.join(targetPath, "apps"));
  await fs.ensureDir(path.join(targetPath, "packages"));

  await fs.copy(path.join(baseTsPath, "client"), path.join(targetPath, "apps", "web"));
  await fs.copy(path.join(baseTsPath, "server"), path.join(targetPath, "apps", "api"));

  await fs.outputJson(
    path.join(targetPath, "package.json"),
    buildMonorepoRootPackageJson(projectName, packageManager),
    { spaces: 2 },
  );

  if (packageManager === "pnpm") {
    await fs.outputFile(
      path.join(targetPath, "pnpm-workspace.yaml"),
      `packages:\n  - "apps/*"\n  - "packages/*"\n`,
    );
  }

  await fs.outputJson(
    path.join(targetPath, "tsconfig.base.json"),
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "Bundler",
        strict: true,
        baseUrl: ".",
        paths: {
          "@shared/*": ["packages/shared/src/*"],
        },
      },
    },
    { spaces: 2 },
  );

  await fs.copy(
    path.join(baseTsPath, "README.monorepo.md"),
    path.join(targetPath, "README.md"),
  );

  await fs.outputJson(
    path.join(targetPath, "packages", "shared", "package.json"),
    {
      name: "shared",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "tsc -w -p tsconfig.json",
        build: "tsc -p tsconfig.json",
      },
      dependencies: {},
      devDependencies: {
        typescript: "~5.9.3",
      },
    },
    { spaces: 2 },
  );

  await fs.outputJson(
    path.join(targetPath, "packages", "shared", "tsconfig.json"),
    {
      extends: "../../tsconfig.base.json",
      compilerOptions: {
        rootDir: "src",
        outDir: "dist",
        declaration: true,
        declarationMap: true,
      },
      include: ["src"],
    },
    { spaces: 2 },
  );

  await fs.outputFile(
    path.join(targetPath, "packages", "shared", "src", "index.ts"),
    `export const sharedConstants = {\n  appName: "${projectName}",\n};\n`,
  );

  await fs.outputJson(
    path.join(targetPath, "packages", "config", "package.json"),
    {
      name: "config",
      private: true,
      version: "0.0.0",
      scripts: {
        dev: "echo \"config package\"",
        build: "echo \"config package\"",
      },
      files: ["tsconfig.json"],
    },
    { spaces: 2 },
  );

  await fs.outputJson(
    path.join(targetPath, "packages", "config", "tsconfig.json"),
    {
      extends: "../../tsconfig.base.json",
    },
    { spaces: 2 },
  );
}

async function configureMonorepoPackages(targetPath: string) {
  await updateJsonFile(path.join(targetPath, "apps", "web", "package.json"), (data) => ({
    ...data,
    name: "web",
  }));

  await updateJsonFile(path.join(targetPath, "apps", "api", "package.json"), (data) => ({
    ...data,
    name: "api",
    type: "module",
    scripts: {
      ...data.scripts,
      dev: "tsx watch src/server.ts",
      build: "tsc -p tsconfig.json",
      start: "node dist/server.js",
    },
    devDependencies: {
      ...data.devDependencies,
      tsx: "^4.20.5",
    },
  }));

  await removeDependency(
    path.join(targetPath, "apps", "api", "package.json"),
    "devDependencies",
    "ts-node-dev",
  );

  await updateJsonFile(
    path.join(targetPath, "apps", "api", "tsconfig.json"),
    (data) => ({
      ...data,
      extends: "../../tsconfig.base.json",
      compilerOptions: {
        ...data.compilerOptions,
        target: "ES2022",
        module: "NodeNext",
        moduleResolution: "NodeNext",
      },
    }),
  );

  await addTsconfigExtends(
    path.join(targetPath, "apps", "web", "tsconfig.app.json"),
    "../../tsconfig.base.json",
  );

  await addTsconfigExtends(
    path.join(targetPath, "apps", "web", "tsconfig.node.json"),
    "../../tsconfig.base.json",
  );

  await ensureViteSharedAlias(path.join(targetPath, "apps", "web", "vite.config.ts"));
}

function buildMonorepoRootPackageJson(
  projectName: string,
  packageManager: "pnpm" | "npm" | "bun",
) {
  const scripts = getMonorepoScripts(packageManager);
  const rootPackage: Record<string, unknown> = {
    name: projectName,
    private: true,
    version: "0.0.0",
    scripts,
    workspaces: ["apps/*", "packages/*"],
  };

  if (packageManager === "pnpm") {
    rootPackage.packageManager = "pnpm@10.24.0";
  }

  return rootPackage;
}

function getMonorepoScripts(packageManager: "pnpm" | "npm" | "bun") {
  switch (packageManager) {
    case "npm":
      return {
        dev: "npm run -ws dev",
        build: "npm run -ws build",
      };
    case "bun":
      return {
        dev: "bun run --filter '*' dev",
        build: "bun run --filter '*' build",
      };
    default:
      return {
        dev: "pnpm -r dev",
        build: "pnpm -r build",
      };
  }
}

async function updateJsonFile(
  filePath: string,
  update: (data: Record<string, unknown>) => Record<string, unknown>,
) {
  const data = (await fs.pathExists(filePath)) ? await fs.readJson(filePath) : {};
  if (!isPlainObject(data)) {
    throw new Error(`Expected JSON object in "${filePath}"`);
  }
  const updated = update(data);
  await fs.outputJson(filePath, updated, { spaces: 2 });
}

async function removeDependency(
  filePath: string,
  section: string,
  dependency: string,
) {
  const data = (await fs.pathExists(filePath)) ? await fs.readJson(filePath) : {};
  if (!isPlainObject(data)) {
    return;
  }
  const deps = data[section];
  if (isPlainObject(deps) && dependency in deps) {
    delete deps[dependency];
    await fs.outputJson(filePath, data, { spaces: 2 });
  }
}

async function addTsconfigExtends(filePath: string, extendsPath: string) {
  if (!(await fs.pathExists(filePath))) {
    return;
  }
  const content = await fs.readFile(filePath, "utf8");
  if (/"extends"\s*:/.test(content)) {
    return;
  }

  const insertLine = `  "extends": "${extendsPath}",\n`;
  let updated = content.replace(/\{\s*\n/, `{\n${insertLine}`);

  if (updated === content) {
    updated = content.replace(/\{/, `{\n${insertLine}`);
  }

  await fs.writeFile(filePath, updated);
}

async function ensureViteSharedAlias(filePath: string) {
  if (!(await fs.pathExists(filePath))) {
    return;
  }

  const content = await fs.readFile(filePath, "utf8");
  if (content.includes("@shared")) {
    return;
  }

  let updated = content;
  if (!/from ['"]path['"]/.test(updated)) {
    updated = updated.replace(
      /import\s+\{\s*defineConfig\s*\}\s+from\s+['"]vite['"]\s*\n/,
      (match) => `${match}import path from 'path'\n`,
    );
  }

  if (updated.includes("resolve: {") && updated.includes("alias: {")) {
    updated = updated.replace(
      /alias:\s*\{\n/,
      (match) =>
        `${match}    '@shared': path.resolve(__dirname, '../../packages/shared/src'),\n`,
    );
  } else {
    updated = updated.replace(
      /defineConfig\(\{\n/,
      (match) =>
        `${match}  resolve: {\n    alias: {\n      '@shared': path.resolve(__dirname, '../../packages/shared/src'),\n    },\n  },\n`,
    );
  }

  await fs.writeFile(filePath, updated);
}
