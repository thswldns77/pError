#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TERRAFORM_DIR="$ROOT_DIR/infra/terraform"
REGION="${AWS_REGION:-us-east-1}"

terraform_output() {
  local value
  value="$(terraform -chdir="$TERRAFORM_DIR" output -no-color -raw "$1" 2>/dev/null || true)"
  if [[ "$value" == *"Warning:"* || "$value" == *"No outputs found"* ]]; then
    return 0
  fi
  printf "%s" "$value"
}

ALB_DNS="${ALB_DNS:-$(terraform_output alb_dns_name)}"
if [[ -z "$ALB_DNS" ]]; then
  ALB_DNS="$(aws elbv2 describe-load-balancers \
    --region "$REGION" \
    --names perror-alb \
    --query "LoadBalancers[0].DNSName" \
    --output text)"
fi
if [[ -z "$ALB_DNS" || "$ALB_DNS" == "None" ]]; then
  echo "Could not resolve ALB DNS. Set ALB_DNS manually or apply Terraform first." >&2
  exit 1
fi

DASHBOARD_BUCKET="${DASHBOARD_BUCKET:-$(terraform_output dashboard_bucket)}"
if [[ -z "$DASHBOARD_BUCKET" ]]; then
  DASHBOARD_BUCKET="$(aws s3api list-buckets \
    --query "Buckets[?contains(Name, 'perror-dashboard')].Name | [0]" \
    --output text)"
fi
if [[ -z "$DASHBOARD_BUCKET" || "$DASHBOARD_BUCKET" == "None" ]]; then
  echo "Could not resolve dashboard bucket. Set DASHBOARD_BUCKET manually or apply Terraform first." >&2
  exit 1
fi

API_BASE_URL="http://$ALB_DNS"
DIST_DIR="$ROOT_DIR/apps/dashboard/dist"

echo "API_BASE_URL=$API_BASE_URL"
echo "DASHBOARD_BUCKET=$DASHBOARD_BUCKET"

VITE_API_BASE_URL="$API_BASE_URL" pnpm --dir "$ROOT_DIR" --filter @perror/dashboard build

API_BASE_URL="$API_BASE_URL" DIST_DIR="$DIST_DIR" node --input-type=module <<'NODE'
import { writeFileSync } from "node:fs"

const apiBaseUrl = process.env.API_BASE_URL
const distDir = process.env.DIST_DIR

if (!apiBaseUrl || !distDir) {
  throw new Error("API_BASE_URL and DIST_DIR are required")
}

writeFileSync(
  `${distDir}/runtime-config.json`,
  `${JSON.stringify({ apiBaseUrl }, null, 2)}\n`,
)
NODE

aws s3 sync "$DIST_DIR" "s3://$DASHBOARD_BUCKET" --delete --region "$REGION"

echo "Dashboard: http://$DASHBOARD_BUCKET.s3-website-$REGION.amazonaws.com"
echo "Event Test Site: http://$DASHBOARD_BUCKET.s3-website-$REGION.amazonaws.com/load-test.html"
