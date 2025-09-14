#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/setup_s3.sh BUCKET REGION [AWS_PROFILE]
# Example: ./scripts/setup_s3.sh hearing-decoded-media us-east-1 default

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 BUCKET REGION [AWS_PROFILE]"
  exit 1
fi

BUCKET="$1"
REGION="$2"
PROFILE_OPT=""
if [[ ${3-} != "" ]]; then
  PROFILE_OPT=(--profile "$3")
fi

command -v aws >/dev/null 2>&1 || { echo "aws CLI is required"; exit 1; }

# 1) Create bucket (special-case us-east-1 which doesn't accept LocationConstraint)
if aws s3api head-bucket --bucket "$BUCKET" "${PROFILE_OPT[@]}" 2>/dev/null; then
  echo "Bucket $BUCKET already exists (and you can access it)."
else
  if [[ "$REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$BUCKET" "${PROFILE_OPT[@]}"
  else
    aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" \
      --create-bucket-configuration LocationConstraint="$REGION" "${PROFILE_OPT[@]}"
  fi
  echo "Created bucket $BUCKET in $REGION"
fi

# 2) Allow public access to objects (so listeners can stream files)
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false \
  "${PROFILE_OPT[@]}"

echo "Applied public access block settings (allow public)."

# 3) Bucket policy: public read for all objects
POLICY_JSON=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadForObjects",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::$BUCKET/*"
    }
  ]
}
EOF
)
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$POLICY_JSON" "${PROFILE_OPT[@]}"
echo "Attached public read bucket policy."

# 4) CORS: allow localhost:3000 now; add your Netlify URL later
CORS_JSON=$(cat <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:3000"],
      "AllowedMethods": ["GET", "HEAD", "PUT"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF
)
aws s3api put-bucket-cors --bucket "$BUCKET" --cors-configuration "$CORS_JSON" "${PROFILE_OPT[@]}"
echo "Configured CORS for http://localhost:3000 (update later with your Netlify URL)."

# 5) IAM user with minimal S3 write to our prefixes
USER_NAME="hearing-decoded-deploy"
if aws iam get-user --user-name "$USER_NAME" "${PROFILE_OPT[@]}" >/dev/null 2>&1; then
  echo "IAM user $USER_NAME already exists."
else
  aws iam create-user --user-name "$USER_NAME" "${PROFILE_OPT[@]}" >/dev/null
  echo "Created IAM user $USER_NAME"
fi

WRITE_POLICY_NAME="HearingDecodedS3Write"
WRITE_POLICY_DOC=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowPutToEpisodeAndTranscriptPrefixes",
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": [
        "arn:aws:s3:::$BUCKET/episodes/*",
        "arn:aws:s3:::$BUCKET/transcripts/*"
      ]
    }
  ]
}
EOF
)
# Attach/overwrite inline policy
aws iam put-user-policy --user-name "$USER_NAME" --policy-name "$WRITE_POLICY_NAME" --policy-document "$WRITE_POLICY_DOC" "${PROFILE_OPT[@]}"
echo "Attached inline write policy to $USER_NAME"

# 6) Create an access key for the user (or reuse last one)
ACCESS_OUT=$(aws iam create-access-key --user-name "$USER_NAME" "${PROFILE_OPT[@]}" 2>/dev/null || true)
if [[ -z "$ACCESS_OUT" ]]; then
  echo "Note: Could not create a new access key (may have reached limit). You can list existing keys with: aws iam list-access-keys --user-name $USER_NAME"
  echo "Skipping .env.local creation."
  exit 0
fi

# Parse JSON with python3 to avoid jq dependency
AWS_ACCESS_KEY_ID=$(python3 -c 'import sys,json; print(json.loads(sys.stdin.read())["AccessKey"]["AccessKeyId"])' <<< "$ACCESS_OUT")
AWS_SECRET_ACCESS_KEY=$(python3 -c 'import sys,json; print(json.loads(sys.stdin.read())["AccessKey"]["SecretAccessKey"])' <<< "$ACCESS_OUT")

# 7) Write .env.local for local dev (gitignored)
cat > .env.local <<ENV
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET=$BUCKET
AWS_S3_REGION=$REGION
# OPENAI_API_KEY=your_openai_key_here
ENV

echo "Wrote credentials to .env.local (gitignored). Keep these secrets safe."

echo "Done. Next steps:"
echo "1) Add your OPENAI_API_KEY to .env.local"
echo "2) Run: npm run dev, then open http://localhost:3000/admin"
echo "3) After deploying to Netlify, add the same variables in Site Settings -> Environment"
