#!/usr/bin/env bash
set -euo pipefail

REGION="${1:-ap-south-1}"
REPOS="${2:-catalog-service,order-service,gateway,frontend}"

IFS=',' read -r -a REPO_ARRAY <<< "$REPOS"

for repo in "${REPO_ARRAY[@]}"; do
  trimmed="$(echo "$repo" | xargs)"
  if [[ -z "$trimmed" ]]; then
    continue
  fi

  echo "Ensuring ECR repository exists: $trimmed"
  if aws ecr describe-repositories --repository-names "$trimmed" --region "$REGION" >/dev/null 2>&1; then
    echo "Already exists: $trimmed"
  else
    aws ecr create-repository --repository-name "$trimmed" --region "$REGION" >/dev/null
    echo "Created: $trimmed"
  fi
done
