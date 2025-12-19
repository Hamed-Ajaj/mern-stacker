// src/cli.ts
import { program } from "commander";

// src/run.ts
import { select } from "@inquirer/prompts";
import ora from "ora";

// src/generators/createBase.ts
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
async function createBase(projectName) {
  const templatePath = path.join(__dirname, "../templates/base");
  const targetPath = path.resolve(process.cwd(), projectName);
  if (await fs.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }
  await fs.copy(templatePath, targetPath);
}

// src/run.ts
async function run(projectName) {
  const stack = await select({
    message: "Choose a stack to generate",
    choices: [
      {
        name: "Base (React + Vite + Express)",
        value: "base"
      }
    ]
  });
  const spinner = ora("Creating project...").start();
  try {
    if (stack === "base") {
      await createBase(projectName);
    }
    spinner.succeed("Project created successfully");
    console.log("\nNext steps:");
    console.log(`  cd ${projectName}`);
    console.log("  cd client && npm install && npm run dev");
    console.log("  cd server && npm install && npm run dev");
  } catch (error) {
    spinner.fail("Failed to create project");
    console.error(error);
  }
}

// src/cli.ts
program.name("create-mern-stacker").argument("<project-name>").action(run);
program.parse();
