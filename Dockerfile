FROM node:24-alpine

# Install required dependencies
RUN apk add --no-cache curl jq

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies (if needed for penpot CLI)
COPY package.json* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm install --prod --frozen-lockfile 2>/dev/null || true

# Copy export script and create tokens directory
COPY export-tokens.sh ./
RUN chmod +x export-tokens.sh && mkdir -p /tokens

CMD ["./export-tokens.sh"]
