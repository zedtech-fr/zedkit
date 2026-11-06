import { z } from "zod";

export const storageConfigSchema = z.object({
  bucket: z.string().min(1),
  region: z.string().min(1),
  accessKeyId: z.string().min(1),
  secretAccessKey: z.string().min(1),
  endpoint: z.string().url().optional(),
  forcePathStyle: z.boolean().optional(),
  publicBaseUrl: z.string().url().optional(),
  keyPrefix: z.string().optional(),
});

export type StorageConfig = z.infer<typeof storageConfigSchema>;

const envShape = {
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_REGION: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  STORAGE_PUBLIC_BASE_URL: z.string().url().optional(),
  STORAGE_KEY_PREFIX: z.string().optional(),
} as const;

/** Parse storage settings from the environment (explicit keys only — no default credential chain). */
export function loadStorageConfig(
  source: Record<string, string | undefined> = process.env,
): StorageConfig {
  const parsed = z.object(envShape).safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid storage environment:\n${issues}`);
  }
  const env = parsed.data;
  return storageConfigSchema.parse({
    bucket: env.STORAGE_BUCKET,
    region: env.STORAGE_REGION,
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
    endpoint: env.STORAGE_ENDPOINT,
    forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
    publicBaseUrl: env.STORAGE_PUBLIC_BASE_URL,
    keyPrefix: env.STORAGE_KEY_PREFIX,
  });
}
