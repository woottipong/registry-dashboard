#!/usr/bin/env bash
set -euo pipefail

REGISTRY_HOST="${REGISTRY_HOST:-localhost:5000}"

REPOSITORIES=(
  "library/nginx"
  "library/redis"
  "library/alpine"
  "apps/frontend"
  "apps/backend"
)

TAGS=("latest" "dev" "v1")

SOURCE_IMAGE="busybox:latest"

echo "Seeding local registry at ${REGISTRY_HOST}"
echo "Using source image: ${SOURCE_IMAGE}"

docker pull "${SOURCE_IMAGE}"

for repo in "${REPOSITORIES[@]}"; do
  for tag in "${TAGS[@]}"; do
    target_image="${REGISTRY_HOST}/${repo}:${tag}"
    echo "Tagging ${SOURCE_IMAGE} -> ${target_image}"
    docker tag "${SOURCE_IMAGE}" "${target_image}"
    echo "Pushing ${target_image}"
    docker push "${target_image}"
  done
done

echo "Registry seed complete."
echo "Pushed ${#REPOSITORIES[@]} repositories x ${#TAGS[@]} tags each."
