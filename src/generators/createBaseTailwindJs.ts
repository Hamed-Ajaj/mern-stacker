import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createBaseTailwindJs(projectName: string) {
  const templatePath = path.join(__dirname, "../templates/base-tailwind-js");

  const cwd = process.env.INIT_CWD || process.cwd();
  const targetPath = path.resolve(cwd, projectName);

  if (await fs.pathExists(targetPath)) {
    throw new Error(`Directory "${projectName}" already exists`);
  }

  await fs.copy(templatePath, targetPath);
}
