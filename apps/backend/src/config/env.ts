import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  BACKEND_PUBLIC_URL: z.string().url().default("http://localhost:4000"),
  MONGODB_URI: z.string().min(1).default("mongodb://127.0.0.1:27017/vastra_house"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid backend environment configuration", parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
export const isProduction = env.NODE_ENV === "production";
