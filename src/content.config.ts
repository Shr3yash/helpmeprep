import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const quizItem = z.object({
  kind: z.enum(["mc", "short"]),
  question: z.string(),
  choices: z.array(z.string()).optional(),
  answer: z.number().int().nonnegative().optional(),
  reveal: z.string().optional(),
  explain: z.string().optional(),
});

const reference = z.object({
  title: z.string(),
  url: z.string(),
});

const pageSchema = z.object({
  title: z.string(),
  description: z.string(),
  track: z.string(),
  section: z.string(),
  order: z.number().default(0),
  slug: z.string().optional(),
  references: z.array(reference).default([]),
  failureModes: z.array(z.string()).default([]),
  sayThis: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  quiz: z.array(quizItem).default([]),
});

const roundSchema = z.object({
  name: z.string(),
  duration: z.string(),
  format: z.string(),
  scored: z.array(z.string()),
  checklist: z.array(z.string()),
  topics: z.array(z.string()),
  practice: z.array(z.string()),
});

export const collections = {
  pages: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/pages" }),
    schema: pageSchema,
  }),
  companies: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/companies" }),
    schema: pageSchema.extend({
      role: z.string(),
      when: z.string(),
      where: z.string(),
      summary: z.string(),
      rounds: z.array(roundSchema),
    }),
  }),
};

export type QuizItem = z.infer<typeof quizItem>;
