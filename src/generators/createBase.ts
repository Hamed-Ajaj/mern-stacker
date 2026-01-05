import { createProject } from "./createProject";

export async function createBase(projectName: string) {
  await createProject({
    projectName,
    language: "ts",
    features: [],
  });
}
