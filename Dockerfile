# Use Node 20 Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for Prisma (OpenSSL)
RUN apk add --no-cache openssl

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client (will be needed when Prisma is added)
# This will fail gracefully if schema.prisma doesn't exist yet
RUN npx prisma generate || echo "Prisma schema not found, skipping generation"

# Expose port 3000
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]
