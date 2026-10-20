import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { QuizItem } from "../content.config";

const ROOT = path.resolve("src/content/quizzes");

/** Sidecar quizzes override frontmatter when present. Supports JSON and YAML. */
export function resolveQuiz(slug: string, fromFrontmatter: QuizItem[]): QuizItem[] {
  for (const ext of [".json", ".yaml", ".yml"]) {
    const file = path.join(ROOT, `${slug}${ext}`);
    if (!fs.existsSync(file)) continue;
    const raw = fs.readFileSync(file, "utf8");
    const data = ext === ".json" ? JSON.parse(raw) : parseYaml(raw);
    const items = Array.isArray(data) ? data : data?.quiz;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error(`Quiz sidecar ${file} did not contain a non-empty quiz array`);
    }
    return items as QuizItem[];
  }
  return fromFrontmatter;
}
