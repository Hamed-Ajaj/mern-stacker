#!/usr/bin/env node

// src/cli.ts
import { program } from "commander";

// src/run.ts
import { input, select } from "@inquirer/prompts";
import ora from "ora";

// src/generators/createBase.ts
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function createBase(projectName) {
  const templatePath = path.join(__dirname, "../templates/base");
  const cwd = process.env.INIT_CWD || process.cwd();
  const targetPath = path.resolve(cwd, projectName);
  if (await fs.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }
  await fs.copy(templatePath, targetPath);
}

// src/generators/createBaseJs.ts
import fs2 from "fs-extra";
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = path2.dirname(__filename2);
async function createBaseJs(projectName) {
  const templatePath = path2.join(__dirname2, "../templates/base-js");
  const cwd = process.env.INIT_CWD || process.cwd();
  const targetPath = path2.resolve(cwd, projectName);
  if (await fs2.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }
  await fs2.copy(templatePath, targetPath);
}

// src/generators/createBaseTailwind.ts
import fs3 from "fs-extra";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
async function createBaseTailwind(projectName) {
  const templatePath = path3.join(__dirname3, "../templates/base-tailwind");
  const cwd = process.env.INIT_CWD || process.cwd();
  const targetPath = path3.resolve(cwd, projectName);
  if (await fs3.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }
  await fs3.copy(templatePath, targetPath);
}

// src/generators/createBaseTailwindJs.ts
import fs4 from "fs-extra";
import path4 from "path";
import { fileURLToPath as fileURLToPath4 } from "url";
var __filename4 = fileURLToPath4(import.meta.url);
var __dirname4 = path4.dirname(__filename4);
async function createBaseTailwindJs(projectName) {
  const templatePath = path4.join(__dirname4, "../templates/base-tailwind-js");
  const cwd = process.env.INIT_CWD || process.cwd();
  const targetPath = path4.resolve(cwd, projectName);
  if (await fs4.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }
  await fs4.copy(templatePath, targetPath);
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
  const stack = await select({
    message: "Choose a stack to generate",
    choices: [
      { name: "Base (React + Vite + Express + mySql)", value: "base" },
      { name: "Base + Tailwind (React + Vite + Express + mySql)", value: "base-tailwind" }
    ]
  });
  const spinner = ora("Creating project...").start();
  try {
    if (language === "ts" && stack === "base") {
      await createBase(resolvedName);
    }
    if (language === "ts" && stack === "base-tailwind") {
      await createBaseTailwind(resolvedName);
    }
    if (language === "js" && stack === "base") {
      await createBaseJs(resolvedName);
    }
    if (language === "js" && stack === "base-tailwind") {
      await createBaseTailwindJs(resolvedName);
    }
    spinner.succeed("Project created successfully");
    console.log("\nNext steps:");
    console.log(`  cd ${resolvedName}`);
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
