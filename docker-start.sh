#!/bin/sh

# Run migrations if they exist, otherwise push schema
if [ -d "./prisma/migrations" ]; then
  echo "Running prisma migrate deploy..."
  npx prisma migrate deploy
else
  echo "No migrations found, running prisma db push..."
  npx prisma db push --accept-data-loss
fi

# Start the application
echo "Starting application..."
npm start
