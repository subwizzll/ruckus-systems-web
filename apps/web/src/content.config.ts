import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

const servicesSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    duration: z.number().int().min(1),
    price: z.string(),
    amount: z.number(),
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

export const collections = { services };
