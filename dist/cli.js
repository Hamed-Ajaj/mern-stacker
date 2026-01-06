#!/usr/bin/env node

// src/cli.ts
import { program } from "commander";

// src/run.ts
import { checkbox, input, select } from "@inquirer/prompts";
import ora from "ora";

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
  const featurePath = path.join(__dirname, "../templates/features", featureName);
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
  const templatePath = path.join(__dirname, "../templates/base", language);
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
        name: "TanStack Router",
        value: "tanstack-router",
        disabled: "(Coming soon)"
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
  const database = await select({
    message: "Choose a database",
    choices: [
      { name: "None", value: "none" },
      { name: "Postgres", value: "db-postgres" },
      { name: "MySQL", value: "db-mysql" }
    ]
  });
  const dockerChoice = await select({
    message: "Use Docker Compose for the database?",
    choices: [
      { name: "No", value: "none" },
      { name: "Yes", value: "yes" }
    ]
  });
  const spinner = ora("Creating project...").start();
  try {
    const dockerFeature = dockerChoice === "yes" && database !== "none" ? database === "db-postgres" ? "docker-postgres" : "docker-mysql" : "none";
    const selectedFeatures = [
      ...frontendFeatures,
      router,
      database,
      dockerFeature
    ].filter((feature) => feature !== "none");
    await createProject({
      projectName: resolvedName,
      language,
      features: selectedFeatures
    });
    spinner.succeed("Project created successfully");
    console.log("\nNext steps:");
    console.log(`  cd ${resolvedName}`);
    console.log("  docker build up -d");
    console.log("  cd client && npm install && npm run dev");
    console.log("  cd server && npm install && npm run dev");
  } catch (error) {
    spinner.fail("Failed to create project");
    console.error(error);
  }
}

// src/cli.ts
program.name("create-mern-stacker").argument("[project-name]").action(run);
program.parse();
