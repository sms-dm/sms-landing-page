#!/bin/bash
echo "Running custom build for Railway..."
npm install --legacy-peer-deps
echo "Generating Prisma client..."
npm run db:generate:prod
echo "Compiling TypeScript..."
npx tsc
echo "Build complete!"