#!/bin/bash
# Railway deployment script for backend

echo "Starting deployment..."

# Ensure we're in the right directory
cd /app/SMS-Onboarding-Unified/backend || exit 1

# Copy prisma folder from parent directory
echo "Setting up Prisma..."
cp -r ../prisma ./prisma

# Install dependencies
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "Running migrations..."
npx prisma migrate deploy

# Start the server with ts-node in transpile-only mode
echo "Starting server..."
npx ts-node --transpile-only src/server.ts