import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_S3_REGION });

export async function POST(req: NextRequest) {
  const { filename, contentType } = await req.json();
  const Bucket = process.env.AWS_S3_BUCKET!;
  const Key = `episodes/${crypto.randomUUID()}-${filename}`;
  const command = new PutObjectCommand({ Bucket, Key, ContentType: contentType });
  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
  const publicUrl = `https://${Bucket}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${Key}`;
  return NextResponse.json({ url, publicUrl, key: Key });
}
