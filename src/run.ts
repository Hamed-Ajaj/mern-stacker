import { input, select } from "@inquirer/prompts";
import ora from "ora";
import { createProject } from "./generators/createProject";

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
    ],
  });

  const styling = await select({
    message: "Choose styling",
    choices: [
      { name: "None", value: "none" },
      { name: "Tailwind CSS", value: "tailwind" },
    ],
  });

  const dataFetching = await select({
    message: "Choose data fetching",
    choices: [
      { name: "None", value: "none" },
      { name: "TanStack Query", value: "query-tanstack" },
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
      styling,
      router,
      dataFetching,
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
    console.log("  cd client && npm install && npm run dev");
    console.log("  cd server && npm install && npm run dev");
  } catch (error) {
    spinner.fail("Failed to create project");
    console.error(error);
  }
}
