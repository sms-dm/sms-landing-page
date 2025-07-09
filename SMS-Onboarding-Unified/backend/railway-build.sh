#!/bin/bash
echo "Running custom build for Railway..."
npm install --legacy-peer-deps
npx prisma generate --schema=../prisma/schema.prisma
echo "Build complete!"