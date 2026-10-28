import { S3Client } from "@aws-sdk/client-s3";

import type { StorageConfig } from "./config.js";

/**
 * Build an S3 client with explicit credentials and checksum calculation only when required
 * (S3-compatible providers; see package README).
 */
export function createS3Client(config: StorageConfig): S3Client {
  const options: ConstructorParameters<typeof S3Client>[0] = {
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
  };
  if (config.endpoint !== undefined) {
    options.endpoint = config.endpoint;
  }
  if (config.forcePathStyle !== undefined) {
    options.forcePathStyle = config.forcePathStyle;
  }
  return new S3Client(options);
}
