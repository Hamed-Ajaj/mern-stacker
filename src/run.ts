import { input, select } from "@inquirer/prompts";
import ora from "ora";
import { createBase } from "./generators/createBase";
import { createBaseJs } from "./generators/createBaseJs";
import { createBaseTailwind } from "./generators/createBaseTailwind";
import { createBaseTailwindJs } from "./generators/createBaseTailwindJs";

export async function run(projectName?: string) {
  const resolvedName =
    projectName?.trim() ||
    (await input({
      message: "Project name",
      validate: (value) =>
        value.trim().length > 0 || "Please enter a project name",
    }));

  const language = await select({
    message: "Choose a language",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "JavaScript", value: "js" },
    ],
  });

  const stack = await select({
    message: "Choose a stack to generate",
    choices: [
      { name: "Base (React + Vite + Express + mySql)", value: "base" },
      { name: "Base + Tailwind (React + Vite + Express + mySql)", value: "base-tailwind" },
    ],
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
