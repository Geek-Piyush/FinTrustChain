FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Install build dependencies for native modules (sharp, etc.)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

# Copy build context
COPY . .

# If build context is repo root, normalize to server app root.
RUN if [ -f server/package.json ]; then cp -a server/. /usr/src/app/; fi

# Install dependencies (deterministic when lockfile exists).
RUN if [ -f package-lock.json ]; then \
            npm ci --omit=dev --no-audit; \
        else \
            npm install --omit=dev --no-audit; \
        fi && npm cache clean --force

# Create necessary directories with proper permissions
RUN mkdir -p logs \
    public/contracts \
    public/img/esigns \
    public/img/proofs \
    public/img/users \
    public/fonts \
    public/templates

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port (Render will use PORT env variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "server.js"]
