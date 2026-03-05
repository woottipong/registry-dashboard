import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default("Registry Dashboard"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  DATA_DIR: z.string().default("./data"),
  DEFAULT_REGISTRY_URL: z.string().optional(),
  DEFAULT_REGISTRY_NAME: z.string().optional(),
  DEFAULT_REGISTRY_AUTH_TYPE: z.enum(["none", "basic", "bearer"]).default("none"),
  DEFAULT_REGISTRY_USERNAME: z.string().optional(),
  DEFAULT_REGISTRY_PASSWORD: z.string().optional(),
  SESSION_SECRET: z.string().min(16, "SESSION_SECRET must be at least 16 characters"),
  APP_USERNAME: z.string().default("admin"),
  APP_PASSWORD: z.string().min(1, "APP_PASSWORD is required"),
})

// Validate environment variables at startup — fail fast if misconfigured
const parsed = envSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATA_DIR: process.env.DATA_DIR ?? "./data",
  DEFAULT_REGISTRY_URL: process.env.DEFAULT_REGISTRY_URL,
  DEFAULT_REGISTRY_NAME: process.env.DEFAULT_REGISTRY_NAME,
  DEFAULT_REGISTRY_AUTH_TYPE: process.env.DEFAULT_REGISTRY_AUTH_TYPE,
  DEFAULT_REGISTRY_USERNAME: process.env.DEFAULT_REGISTRY_USERNAME,
  DEFAULT_REGISTRY_PASSWORD: process.env.DEFAULT_REGISTRY_PASSWORD,
  SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-secret-change-in-production",
  APP_USERNAME: process.env.APP_USERNAME ?? "admin",
  APP_PASSWORD: process.env.APP_PASSWORD,
})

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:")
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error("Invalid environment configuration. Check .env.local against .env.example.")
}

export const config = parsed.data
