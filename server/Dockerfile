FROM node:20-bookworm-slim

# Install OpenSSL & certificates required for Prisma engine and sharp
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the server source code
COPY . .

# Ensure entrypoint is executable
RUN chmod +x ./docker-entrypoint.sh

# Expose server port
EXPOSE 4000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "src/index.js"]
