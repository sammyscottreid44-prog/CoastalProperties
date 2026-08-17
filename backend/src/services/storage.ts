import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

export type StoredFile = {
  key: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
};

function createS3Client(): S3Client {
  return new S3Client({
    region: config.s3.region,
    endpoint: config.s3.endpoint,
    forcePathStyle: config.s3.forcePathStyle,
    credentials: {
      accessKeyId: config.s3.accessKeyId,
      secretAccessKey: config.s3.secretAccessKey,
    },
  });
}

async function storeLocal(
  key: string,
  body: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredFile> {
  const fullPath = path.join(config.localUploadDir, key);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, body);
  return {
    key,
    url: `file://${fullPath}`,
    originalName,
    mimeType,
    size: body.length,
  };
}

async function storeS3(
  key: string,
  body: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredFile> {
  const client = createS3Client();
  await client.send(
    new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
      Metadata: {
        originalname: encodeURIComponent(originalName),
      },
    }),
  );

  const url = config.s3.endpoint
    ? `${config.s3.endpoint.replace(/\/$/, "")}/${config.s3.bucket}/${key}`
    : `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;

  return {
    key,
    url,
    originalName,
    mimeType,
    size: body.length,
  };
}

export async function storeFile(params: {
  submissionId: string;
  category: string;
  originalName: string;
  mimeType: string;
  body: Buffer;
}): Promise<StoredFile> {
  const safeName = params.originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `submissions/${params.submissionId}/${params.category}/${Date.now()}-${safeName}`;

  const stored =
    config.storageDriver === "s3"
      ? await storeS3(key, params.body, params.originalName, params.mimeType)
      : await storeLocal(key, params.body, params.originalName, params.mimeType);

  logger.info("file_stored", {
    driver: config.storageDriver,
    key: stored.key,
    size: stored.size,
  });

  return stored;
}
