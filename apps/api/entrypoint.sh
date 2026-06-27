#!/bin/sh
set -e

echo ">>> Syncing schema to database..."
npx prisma db push --accept-data-loss

echo ">>> Seeding database..."
npx tsx prisma/seed.ts || echo "Seed skipped (data may already exist)"

echo ">>> Starting API..."
exec node dist/src/main
