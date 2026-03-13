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
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters")
    .refine(
      (s) => /[a-z]/.test(s) && /[A-Z0-9+/=]/.test(s),
      "SESSION_SECRET appears to be low entropy — generate with: openssl rand -base64 32",
    ),
  APP_USERNAME: z.string().min(1).default("admin"),
  APP_PASSWORD: z.string().min(8, "APP_PASSWORD must be at least 8 characters"),
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
  SESSION_SECRET: process.env.SESSION_SECRET,
  APP_USERNAME: process.env.APP_USERNAME ?? "admin",
  APP_PASSWORD: process.env.APP_PASSWORD,
})

if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors
  const details = Object.entries(fieldErrors)
    .map(([key, msgs]) => `  ${key}: ${(msgs as string[]).join(", ")}`)
    .join("\n")
  console.error(`❌ Invalid environment configuration:\n${details}`)
  throw new Error(`Invalid environment configuration:\n${details}`)
}

export const config = parsed.data
