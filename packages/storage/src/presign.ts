import { GetObjectCommand, HeadObjectCommand, PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import type { StorageConfig } from "./config.js";
import { sanitizeObjectKey } from "./sanitize-key.js";

export type PresignPutInput = {
  key: string;
  contentType?: string;
  expiresInSeconds?: number;
};

export type PresignGetInput = {
  key: string;
  expiresInSeconds?: number;
};

function resolveKey(config: StorageConfig, key: string): string {
  return sanitizeObjectKey(key, config.keyPrefix);
}

export async function presignPutUrl(
  client: S3Client,
  config: StorageConfig,
  input: PresignPutInput,
): Promise<string> {
  const Key = resolveKey(config, input.key);
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key,
    ...(input.contentType !== undefined ? { ContentType: input.contentType } : {}),
  });
  return getSignedUrl(client, command, { expiresIn: input.expiresInSeconds ?? 900 });
}

export async function presignGetUrl(
  client: S3Client,
  config: StorageConfig,
  input: PresignGetInput,
): Promise<string> {
  const Key = resolveKey(config, input.key);
  const command = new GetObjectCommand({ Bucket: config.bucket, Key });
  return getSignedUrl(client, command, { expiresIn: input.expiresInSeconds ?? 900 });
}

export async function headObject(client: S3Client, config: StorageConfig, key: string) {
  const Key = resolveKey(config, key);
  return client.send(new HeadObjectCommand({ Bucket: config.bucket, Key }));
}
