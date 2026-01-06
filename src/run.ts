import { checkbox, input, select } from "@inquirer/prompts";
import ora from "ora";
import { createProject } from "./generators/createProject.ts";

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

  const router = await select({
    message: "Choose a router",
    choices: [
      { name: "None", value: "none" },
      { name: "React Router", value: "router-react" },
      {
        name: "TanStack Router",
        value: "tanstack-router",
        disabled: "(Coming soon)",
      },
    ],
  });

  const frontendFeatures = await checkbox({
    message: "Choose additional features",
    choices: [
      { name: "Tailwind CSS", value: "tailwind" },
      { name: "TanStack Query", value: "query-tanstack" },
      { name: "Zustand", value: "zustand" },
      ...(language === "ts" ? [{ name: "Zod", value: "zod" }] : []),
    ],
  });

  const database = await select({
    message: "Choose a database",
    choices: [
      { name: "None", value: "none" },
      { name: "Postgres", value: "db-postgres" },
      { name: "MySQL", value: "db-mysql" },
    ],
  });

  const dockerChoice = await select({
    message: "Use Docker Compose for the database?",
    choices: [
      { name: "No", value: "none" },
      { name: "Yes", value: "yes" },
    ],
  });

  const spinner = ora("Creating project...").start();

  try {
    const dockerFeature =
      dockerChoice === "yes" && database !== "none"
        ? database === "db-postgres"
          ? "docker-postgres"
          : "docker-mysql"
        : "none";

    const selectedFeatures = [
      ...frontendFeatures,
      router,
      database,
      dockerFeature,
    ].filter((feature) => feature !== "none");

    await createProject({
      projectName: resolvedName,
      language,
      features: selectedFeatures,
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
