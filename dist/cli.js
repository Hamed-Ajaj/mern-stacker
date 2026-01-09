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
async function applyFeature(targetPath, language, featureName) {
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
  features
}) {
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
  if (features.includes("router-tanstack")) {
    const appFile = language === "ts" ? "App.tsx" : "App.jsx";
    await fs.remove(path.join(targetPath, "client", "src", appFile));
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
      { name: "Postgres", value: "db-postgres" },
      { name: "MySQL", value: "db-mysql" }
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
      { name: "yarn", value: "yarn" },
      { name: "bun", value: "bun" }
    ]
  });
  const installDeps = await confirm({
    message: "Install dependencies now?",
    default: true
  });
  const spinner = ora("Creating project...").start();
  try {
    const dockerFeature = dockerChoice === "yes" && database !== "none" ? database === "db-postgres" ? "docker-postgres" : "docker-mysql" : "none";
    const selectedFeatures = [
      ...frontendFeatures,
      ...useShadcn ? ["shadcn"] : [],
      router,
      database,
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
      features: selectedFeatures
    });
    spinner.succeed("Project created successfully");
    const cwd = process.env.INIT_CWD || process.cwd();
    const projectPath = path2.resolve(cwd, resolvedName);
    const installArgs = ["install"];
    if (installDeps) {
      const installSpinner = ora("Installing dependencies...").start();
      try {
        await execa(packageManager, installArgs, {
          cwd: path2.join(projectPath, "client"),
          stdio: "inherit"
        });
        await execa(packageManager, installArgs, {
          cwd: path2.join(projectPath, "server"),
          stdio: "inherit"
        });
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
      console.log(`  cd client && ${packageManager} install`);
      console.log(`  cd server && ${packageManager} install`);
    }
    const runScript = packageManager === "npm" ? "npm run dev" : `${packageManager} dev`;
    console.log(`  cd client && ${runScript}`);
    console.log(`  cd server && ${runScript}`);
  } catch (error) {
    spinner.fail("Failed to create project");
    console.error(error);
  }
}

// src/cli.ts
program.name("create-mern-stacker").argument("[project-name]").action(run);
program.parse();
