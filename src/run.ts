import { checkbox, confirm, input, select } from "@inquirer/prompts";
import ora from "ora";
import { execa } from "execa";
import path from "path";
import { createProject } from "./generators/createProject.ts";

type Language = "ts" | "js";
type ProjectStructure = "standard" | "monorepo";

export async function run(projectName?: string) {
  const resolvedName =
    projectName?.trim() ||
    (await input({
      message: "Project name",
      validate: (value) =>
        value.trim().length > 0 || "Please enter a project name",
    }));

  const language: Language = await select({
    message: "Choose a language",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "JavaScript", value: "js" },
    ],
  });

  let projectStructure: ProjectStructure = "standard";
  while (true) {
    projectStructure = await select({
      message: "Project structure:",
      choices: [
        { name: "Standard (client / server)", value: "standard" },
        { name: "Monorepo (apps / packages) [TypeScript only]", value: "monorepo" },
      ],
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
        value: "router-tanstack",
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

  const useShadcn = frontendFeatures.includes("tailwind")
    ? await confirm({
        message: "Use shadcn/ui?",
        default: false,
      })
    : false;

  const database = await select({
    message: "Choose a database",
    choices: [
      { name: "None", value: "none" },
      { name: "MongoDB", value: "db-mongo" },
      { name: "Postgres", value: "db-postgres" },
      { name: "MySQL", value: "db-mysql" },
    ],
  });

  let orm = "none";
  if (database === "db-postgres" || database === "db-mysql") {
    orm = await select({
      message: "Choose an ORM",
      choices: [
        { name: "Drizzle ORM", value: "drizzle" },
        { name: "Prisma", value: "prisma" },
      ],
    });
  }

  const authChoice =
    database === "none"
      ? "none"
      : await select({
          message: "Authentication",
          choices: [
            { name: "None", value: "none" },
            { name: "JWT (basic)", value: "jwt" },
            ...(language === "ts"
              ? [{ name: "Better Auth (batteries included)", value: "better-auth" }]
              : []),
          ],
        });

  const dockerChoice =
    database === "none"
      ? "none"
      : await select({
          message: "Use Docker Compose for the database?",
          choices: [
            { name: "No", value: "none" },
            { name: "Yes", value: "yes" },
          ],
        });

  const packageManager = await select({
    message: "Choose a package manager",
    choices: [
      { name: "pnpm", value: "pnpm" },
      { name: "npm", value: "npm" },
      { name: "bun", value: "bun" },
    ],
  });

  const installDeps = await confirm({
    message: "Install dependencies now?",
    default: true,
  });

  const spinner = ora("Creating project...").start();

  try {
    const dockerFeature =
      dockerChoice === "yes" && database !== "none"
        ? database === "db-postgres"
          ? "docker-postgres"
          : database === "db-mysql"
            ? "docker-mysql"
            : "docker-mongo"
        : "none";

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
      ...(useShadcn ? ["shadcn"] : []),
      router,
      database,
      ormFeature,
      ...(authChoice === "better-auth" ? ["auth-better"] : []),
      authFeature,
      dockerFeature,
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
      packageManager,
    });

    spinner.succeed("Project created successfully");

    const cwd = process.env.INIT_CWD || process.cwd();
    const projectPath = path.resolve(cwd, resolvedName);
    const installArgs = ["install"];

    if (installDeps) {
      const installSpinner = ora("Installing dependencies...").start();
      try {
        if (projectStructure === "monorepo") {
          await execa(packageManager, installArgs, {
            cwd: projectPath,
            stdio: "inherit",
          });
        } else {
          await execa(packageManager, installArgs, {
            cwd: path.join(projectPath, "client"),
            stdio: "inherit",
          });
          await execa(packageManager, installArgs, {
            cwd: path.join(projectPath, "server"),
            stdio: "inherit",
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
    const runScript =
      packageManager === "npm"
        ? "npm run dev"
        : packageManager === "bun"
          ? "bun run dev"
          : `${packageManager} dev`;

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
