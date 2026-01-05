import { createProject } from "./createProject";

export async function createBaseTailwindJs(projectName: string) {
  await createProject({
    projectName,
    language: "js",
    features: ["tailwind"],
  });
}
