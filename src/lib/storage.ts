import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

function getClient() {
  return new S3Client({
    region: process.env.S3_REGION ?? "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    // Required for path-style URLs (MinIO, some R2 configs)
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  });
}

function publicUrl(key: string) {
  const base = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");
  return `${base}/${key}`;
}

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return publicUrl(key);
}

export async function deleteFile(urlOrKey: string): Promise<void> {
  const base = (process.env.S3_PUBLIC_URL ?? "").replace(/\/$/, "");
  // Accept either a full public URL or a bare key
  const key = urlOrKey.startsWith(base)
    ? urlOrKey.slice(base.length + 1)
    : urlOrKey;

  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    })
  );
}
