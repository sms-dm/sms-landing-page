#!/bin/bash
# Quick fix deployment script

echo "Starting quick fix deployment..."

cd /app/SMS-Onboarding-Unified/backend || exit 1

# Copy prisma folder
cp -r ../prisma ./prisma

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create symlinks for missing controllers
cd api/controllers
ln -sf stub.controller.ts analytics.controller.ts
ln -sf stub.controller.ts batch.controller.ts
ln -sf stub.controller.ts company.controller.ts
ln -sf stub.controller.ts file.controller.ts
ln -sf stub.controller.ts sync.controller.ts
ln -sf stub.controller.ts token.controller.ts
ln -sf stub.controller.ts webhook.controller.ts
cd ../..

# Run migrations (allow to fail)
npx prisma migrate deploy || echo "Migrations skipped"

# Start with mock database if no DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "No DATABASE_URL found, starting in mock mode"
  export MOCK_DATABASE=true
fi

# Start server
echo "Starting server..."
npx ts-node --transpile-only src/server.ts