# Use Node.js 20 slim as base
FROM node:20-slim

# Install openssl for Prisma and other potential needs
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
# We use 'npm install' to ensure all dependencies (including devDependencies needed for build) are present
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the frontend
# This will generate the static files in /app/frontend/dist
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Make the start script executable
RUN chmod +x docker-start.sh

# Start the application using the start script
CMD ["./docker-start.sh"]
