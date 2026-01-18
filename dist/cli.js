#!/usr/bin/env node

// src/cli.ts
import { program } from "commander";

// src/run.ts
import { checkbox, confirm, input, select } from "@inquirer/prompts";
import ora from "ora";
import { execa } from "execa";
import path2 from "path";

// src/generators/createProject.ts
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(target[key])) {
      deepMerge(target[key], value);
      continue;
    }
    target[key] = value;
  }
}
async function listFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }
  return files;
}
async function applyFeature(targetPath, language, featureName, structure) {
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
      const targetData = await fs.pathExists(targetFile) ? await fs.readJson(targetFile) : {};
      if (!isPlainObject(targetData) || !isPlainObject(patchData)) {
        throw new Error(`Patch file "${relativePath}" must contain a JSON object`);
      }
      deepMerge(targetData, patchData);
      await fs.outputJson(targetFile, targetData, { spaces: 2 });
    }
  }
}
async function createProject({
  projectName,
  language,
  features,
  structure,
  packageManager
}) {
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
      packageManager
    });
  } else {
    await fs.copy(templatePath, targetPath);
  }
  for (const feature of features) {
    await applyFeature(targetPath, language, feature, structure);
  }
  if (features.includes("router-tanstack")) {
    const appFile = language === "ts" ? "App.tsx" : "App.jsx";
    const clientRoot = structure === "monorepo" ? path.join("apps", "web") : "client";
    await fs.remove(path.join(targetPath, clientRoot, "src", appFile));
  }
  if (structure === "monorepo") {
    await configureMonorepoPackages(targetPath);
  }
}
async function resolveTemplatesDir() {
  const candidates = [
    path.resolve(__dirname, "..", "..", "templates"),
    path.resolve(__dirname, "..", "templates")
  ];
  for (const candidate of candidates) {
    if (await fs.pathExists(candidate)) {
      return candidate;
    }
  }
  throw new Error("Templates directory not found");
}
function mapFeaturePath(relativePath, structure, featureName) {
  if (structure !== "monorepo") {
    return relativePath;
  }
  const normalized = relativePath.split(path.sep).join("/");
  if (featureName === "zod" && (normalized.startsWith("client/") || normalized.startsWith("server/"))) {
    return path.join(
      "packages",
      "shared",
      normalized.replace(/^(client|server)\//, "")
    ).replace(/\\/g, path.sep);
  }
  if (normalized.startsWith("client/")) {
    return path.join("apps", "web", normalized.replace(/^client\//, "")).replace(/\\/g, path.sep);
  }
  if (normalized.startsWith("server/")) {
    return path.join("apps", "api", normalized.replace(/^server\//, "")).replace(/\\/g, path.sep);
  }
  return relativePath;
}
async function createMonorepoTemplate({
  targetPath,
  templatesDir,
  projectName,
  packageManager
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
    { spaces: 2 }
  );
  if (packageManager === "pnpm") {
    await fs.outputFile(
      path.join(targetPath, "pnpm-workspace.yaml"),
      `packages:
  - "apps/*"
  - "packages/*"
`
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
          "@shared/*": ["packages/shared/src/*"]
        }
      }
    },
    { spaces: 2 }
  );
  await fs.copy(
    path.join(baseTsPath, "README.monorepo.md"),
    path.join(targetPath, "README.md")
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
        build: "tsc -p tsconfig.json"
      },
      dependencies: {},
      devDependencies: {
        typescript: "~5.9.3"
      }
    },
    { spaces: 2 }
  );
  await fs.outputJson(
    path.join(targetPath, "packages", "shared", "tsconfig.json"),
    {
      extends: "../../tsconfig.base.json",
      compilerOptions: {
        rootDir: "src",
        outDir: "dist",
        declaration: true,
        declarationMap: true
      },
      include: ["src"]
    },
    { spaces: 2 }
  );
  await fs.outputFile(
    path.join(targetPath, "packages", "shared", "src", "index.ts"),
    `export const sharedConstants = {
  appName: "${projectName}",
};
`
  );
  await fs.outputJson(
    path.join(targetPath, "packages", "config", "package.json"),
    {
      name: "config",
      private: true,
      version: "0.0.0",
      scripts: {
        dev: 'echo "config package"',
        build: 'echo "config package"'
      },
      files: ["tsconfig.json"]
    },
    { spaces: 2 }
  );
  await fs.outputJson(
    path.join(targetPath, "packages", "config", "tsconfig.json"),
    {
      extends: "../../tsconfig.base.json"
    },
    { spaces: 2 }
  );
}
async function configureMonorepoPackages(targetPath) {
  await updateJsonFile(path.join(targetPath, "apps", "web", "package.json"), (data) => ({
    ...data,
    name: "web"
  }));
  await updateJsonFile(path.join(targetPath, "apps", "api", "package.json"), (data) => ({
    ...data,
    name: "api",
    type: "module",
    scripts: {
      ...data.scripts,
      dev: "tsx watch src/server.ts",
      build: "tsc -p tsconfig.json",
      start: "node dist/server.js"
    },
    devDependencies: {
      ...data.devDependencies,
      tsx: "^4.20.5"
    }
  }));
  await removeDependency(
    path.join(targetPath, "apps", "api", "package.json"),
    "devDependencies",
    "ts-node-dev"
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
        moduleResolution: "NodeNext"
      }
    })
  );
  await addTsconfigExtends(
    path.join(targetPath, "apps", "web", "tsconfig.app.json"),
    "../../tsconfig.base.json"
  );
  await addTsconfigExtends(
    path.join(targetPath, "apps", "web", "tsconfig.node.json"),
    "../../tsconfig.base.json"
  );
  await ensureViteSharedAlias(path.join(targetPath, "apps", "web", "vite.config.ts"));
}
function buildMonorepoRootPackageJson(projectName, packageManager) {
  const scripts = getMonorepoScripts(packageManager);
  const rootPackage = {
    name: projectName,
    private: true,
    version: "0.0.0",
    scripts,
    workspaces: ["apps/*", "packages/*"]
  };
  if (packageManager === "pnpm") {
    rootPackage.packageManager = "pnpm@10.24.0";
  }
  return rootPackage;
}
function getMonorepoScripts(packageManager) {
  switch (packageManager) {
    case "npm":
      return {
        dev: "npm run -ws dev",
        build: "npm run -ws build"
      };
    case "bun":
      return {
        dev: "bun run --filter '*' dev",
        build: "bun run --filter '*' build"
      };
    default:
      return {
        dev: "pnpm -r dev",
        build: "pnpm -r build"
      };
  }
}
async function updateJsonFile(filePath, update) {
  const data = await fs.pathExists(filePath) ? await fs.readJson(filePath) : {};
  if (!isPlainObject(data)) {
    throw new Error(`Expected JSON object in "${filePath}"`);
  }
  const updated = update(data);
  await fs.outputJson(filePath, updated, { spaces: 2 });
}
async function removeDependency(filePath, section, dependency) {
  const data = await fs.pathExists(filePath) ? await fs.readJson(filePath) : {};
  if (!isPlainObject(data)) {
    return;
  }
  const deps = data[section];
  if (isPlainObject(deps) && dependency in deps) {
    delete deps[dependency];
    await fs.outputJson(filePath, data, { spaces: 2 });
  }
}
async function addTsconfigExtends(filePath, extendsPath) {
  if (!await fs.pathExists(filePath)) {
    return;
  }
  const content = await fs.readFile(filePath, "utf8");
  if (/"extends"\s*:/.test(content)) {
    return;
  }
  const insertLine = `  "extends": "${extendsPath}",
`;
  let updated = content.replace(/\{\s*\n/, `{
${insertLine}`);
  if (updated === content) {
    updated = content.replace(/\{/, `{
${insertLine}`);
  }
  await fs.writeFile(filePath, updated);
}
async function ensureViteSharedAlias(filePath) {
  if (!await fs.pathExists(filePath)) {
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
      (match) => `${match}import path from 'path'
`
    );
  }
  if (updated.includes("resolve: {") && updated.includes("alias: {")) {
    updated = updated.replace(
      /alias:\s*\{\n/,
      (match) => `${match}    '@shared': path.resolve(__dirname, '../../packages/shared/src'),
`
    );
  } else {
    updated = updated.replace(
      /defineConfig\(\{\n/,
      (match) => `${match}  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
`
    );
  }
  await fs.writeFile(filePath, updated);
}

// src/run.ts
async function run(projectName) {
  const resolvedName = (projectName == null ? void 0 : projectName.trim()) || await input({
    message: "Project name",
    validate: (value) => value.trim().length > 0 || "Please enter a project name"
  });
  const language = await select({
    message: "Choose a language",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "JavaScript", value: "js" }
    ]
  });
  let projectStructure = "standard";
  while (true) {
    projectStructure = await select({
      message: "Project structure:",
      choices: [
        { name: "Standard (client / server)", value: "standard" },
        { name: "Monorepo (apps / packages) [TypeScript only]", value: "monorepo" }
      ]
    });
    if (projectStructure === "monorepo" && language === "js") {
      console.log("Monorepo mode requires TypeScript.");
      continue;
    }
    break;
  }
  const router = await select({
    message: "Choose a router",
    choices: [
      { name: "None", value: "none" },
      { name: "React Router", value: "router-react" },
      {
        name: "TanStack Router (recommended with TypeScript)",
        value: "router-tanstack"
      }
    ]
  });
  const frontendFeatures = await checkbox({
    message: "Choose additional features",
    choices: [
      { name: "Tailwind CSS", value: "tailwind" },
      { name: "TanStack Query", value: "query-tanstack" },
      { name: "Zustand", value: "zustand" },
      ...language === "ts" ? [{ name: "Zod", value: "zod" }] : []
    ]
  });
  const useShadcn = frontendFeatures.includes("tailwind") ? await confirm({
    message: "Use shadcn/ui?",
    default: false
  }) : false;
  const database = await select({
    message: "Choose a database",
    choices: [
      { name: "None", value: "none" },
      { name: "MongoDB", value: "db-mongo" },
      { name: "Postgres", value: "db-postgres" },
      { name: "MySQL", value: "db-mysql" }
    ]
  });
  let orm = "none";
  if (database === "db-postgres" || database === "db-mysql") {
    orm = await select({
      message: "Choose an ORM",
      choices: [
        { name: "Drizzle ORM", value: "drizzle" },
        { name: "Prisma", value: "prisma" }
      ]
    });
  }
  const authChoice = database === "none" ? "none" : await select({
    message: "Authentication",
    choices: [
      { name: "None", value: "none" },
      { name: "JWT (basic)", value: "jwt" },
      ...language === "ts" ? [{ name: "Better Auth (batteries included)", value: "better-auth" }] : []
    ]
  });
  const dockerChoice = database === "none" ? "none" : await select({
    message: "Use Docker Compose for the database?",
    choices: [
      { name: "No", value: "none" },
      { name: "Yes", value: "yes" }
    ]
  });
  const packageManager = await select({
    message: "Choose a package manager",
    choices: [
      { name: "pnpm", value: "pnpm" },
      { name: "npm", value: "npm" },
      { name: "bun", value: "bun" }
    ]
  });
  const installDeps = await confirm({
    message: "Install dependencies now?",
    default: true
  });
  const spinner = ora("Creating project...").start();
  try {
    const dockerFeature = dockerChoice === "yes" && database !== "none" ? database === "db-postgres" ? "docker-postgres" : database === "db-mysql" ? "docker-mysql" : "docker-mongo" : "none";
    let ormFeature = "none";
    if (orm !== "none" && database !== "none") {
      ormFeature = `${orm}-${database.replace("db-", "")}`;
    }
    let authFeature = "none";
    if (authChoice === "better-auth") {
      if (orm !== "none") {
        authFeature = `auth-better-${orm}-${database.replace("db-", "")}`;
      } else {
        authFeature = `auth-better-${database}`;
      }
    } else if (authChoice === "jwt") {
      if (orm !== "none") {
        authFeature = `auth-jwt-${orm}-${database.replace("db-", "")}`;
      } else {
        authFeature = `auth-jwt-${database}`;
      }
    }
    const selectedFeatures = [
      ...frontendFeatures,
      ...useShadcn ? ["shadcn"] : [],
      router,
      database,
      ormFeature,
      ...authChoice === "better-auth" ? ["auth-better"] : [],
      authFeature,
      dockerFeature
    ].filter((feature) => feature !== "none");
    if (router === "router-tanstack") {
      if (frontendFeatures.includes("tailwind")) {
        selectedFeatures.push("router-tanstack-tailwind");
      }
    }
    await createProject({
      projectName: resolvedName,
      language,
      features: selectedFeatures,
      structure: projectStructure,
      packageManager
    });
    spinner.succeed("Project created successfully");
    const cwd = process.env.INIT_CWD || process.cwd();
    const projectPath = path2.resolve(cwd, resolvedName);
    const installArgs = ["install"];
    if (installDeps) {
      const installSpinner = ora("Installing dependencies...").start();
      try {
        if (projectStructure === "monorepo") {
          await execa(packageManager, installArgs, {
            cwd: projectPath,
            stdio: "inherit"
          });
        } else {
          await execa(packageManager, installArgs, {
            cwd: path2.join(projectPath, "client"),
            stdio: "inherit"
          });
          await execa(packageManager, installArgs, {
            cwd: path2.join(projectPath, "server"),
            stdio: "inherit"
          });
        }
        installSpinner.succeed("Dependencies installed");
      } catch (installError) {
        installSpinner.fail("Failed to install dependencies");
        throw installError;
      }
    }
    console.log("\nNext steps:");
    console.log(`  cd ${resolvedName}`);
    if (database !== "none" && dockerChoice === "yes") {
      console.log("  docker compose up -d");
    }
    if (!installDeps) {
      if (projectStructure === "monorepo") {
        console.log(`  ${packageManager} install`);
      } else {
        console.log(`  cd client && ${packageManager} install`);
        console.log(`  cd server && ${packageManager} install`);
      }
    }
    if (orm === "drizzle" || orm === "prisma") {
      const apiPath = projectStructure === "monorepo" ? "apps/api" : "server";
      console.log(`  cd ${apiPath} && ${packageManager} run db:push`);
    }
    const runScript = packageManager === "npm" ? "npm run dev" : packageManager === "bun" ? "bun run dev" : `${packageManager} dev`;
    if (projectStructure === "monorepo") {
      console.log(`  ${runScript}`);
    } else {
      console.log(`  cd client && ${runScript}`);
      console.log(`  cd server && ${runScript}`);
    }
  } catch (error) {
    spinner.fail("Failed to create project");
    console.error(error);
  }
}

// src/cli.ts
program.name("create-mern-stacker").argument("[project-name]").action(run);
program.parse();
