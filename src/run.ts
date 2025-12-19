import { select } from "@inquirer/prompts";
import ora from "ora";
import { createBase } from "./generators/createBase";

export async function run(projectName: string) {
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
