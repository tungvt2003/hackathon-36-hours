#!/bin/sh
set -e

echo ">>> Running migrations..."
npx prisma migrate deploy

echo ">>> Seeding database..."
npx tsx prisma/seed.ts || echo "Seed skipped (data may already exist)"

echo ">>> Starting API..."
exec node dist/main
