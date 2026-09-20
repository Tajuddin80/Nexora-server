FROM node:22-alpine

WORKDIR /app

# Copy package manifests and npm configuration (.npmrc contains legacy-peer-deps=true)
COPY package.json package-lock.json .npmrc* ./

# Install production dependencies with legacy peer deps support
RUN npm install --omit=dev --legacy-peer-deps

# Copy application source code
COPY . .

# Set default production environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose HTTP port
EXPOSE 5000

# Health check to ensure Express & Socket.IO server is responsive
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/ || exit 1

# Start the server
CMD ["node", "index.js"]
