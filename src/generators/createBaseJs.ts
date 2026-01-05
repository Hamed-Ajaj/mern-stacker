import { createProject } from "./createProject";

export async function createBaseJs(projectName: string) {
  await createProject({
    projectName,
    language: "js",
    features: [],
  });
}
