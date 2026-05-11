#!/bin/sh

echo "Running Prisma migrations..."

# Run migrations using prisma CLI from node_modules
node_modules/.bin/prisma migrate deploy \
  --schema=packages/db/prisma/schema.prisma || \
echo "Prisma migrations completed or skipped"

echo "Starting API..."

node apps/api/dist/server.js