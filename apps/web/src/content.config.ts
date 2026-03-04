import { defineCollection, z, reference } from "astro:content";
import { glob, file } from "astro/loaders";

// ── Services (existing) ──
const servicesSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    duration: z.number().int().min(1),
    amount: z.number(),
    priceInfo: z.string().nullable().optional(),
    minDaysInAdvance: z.number().int().min(0),
    maxDaysInAdvance: z.number().int().min(0),
  })
  .refine((data) => data.maxDaysInAdvance >= data.minDaysInAdvance, {
    message: "maxDaysInAdvance must be >= minDaysInAdvance",
    path: ["maxDaysInAdvance"],
  });

const services = defineCollection({
  loader: file("src/data/services.json"),
  schema: servicesSchema,
});

// ── Blog Posts (MDX) ──
const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference("authors"),
    heroImage: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    readingTime: z.number().optional(),
    // Microfrontend island metadata
    islands: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          framework: z.enum(["react", "vue", "svelte", "vanilla", "iframe"]),
          src: z.string(),
          loadStrategy: z
            .enum(["load", "visible", "idle", "media"])
            .default("visible"),
        }),
      )
      .default([]),
    // Commenting
    commentsEnabled: z.boolean().default(true),
    agentParticipation: z.boolean().default(true),
  }),
});

// ── Authors ──
const authors = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/data/authors" }),
  schema: z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    url: z.string().url().optional(),
    role: z.enum(["owner", "contributor", "guest"]).default("contributor"),
  }),
});

export const collections = { services, blog, authors };
