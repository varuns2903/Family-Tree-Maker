import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.string().transform(Number),

  MONGO_URI: z.url(),

  JWT_ACCESS_SECRET: z.string().min(10),
  JWT_REFRESH_SECRET: z.string().min(10),

  JWT_ACCESS_TTL: z.string(),
  JWT_REFRESH_TTL: z.string()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables", z.treeifyError(parsedEnv.error));
  process.exit(1);
}

export const env = parsedEnv.data;
