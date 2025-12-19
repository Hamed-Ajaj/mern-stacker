import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createBase(projectName: string) {
  const templatePath = path.join(__dirname, "../templates/base");
  const targetPath = path.resolve(process.cwd(), projectName);

  if (await fs.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }

  await fs.copy(templatePath, targetPath, {
    filter: (src) => {
      return !src.includes("node_modules");
    }
  });
}
