import { createProject } from "./createProject";

export async function createBaseTailwind(projectName: string) {
  await createProject({
    projectName,
    language: "ts",
    features: ["tailwind"],
  });
}
