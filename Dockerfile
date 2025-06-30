FROM node:22-alpine

# Install required dependencies
RUN apk add --no-cache curl jq

# Create app directory
WORKDIR /app

# Copy package.json and install dependencies (if needed for penpot CLI)
COPY package.json* ./
RUN npm install --only=production 2>/dev/null || true

# Copy export script and create tokens directory
COPY export-tokens.sh ./
RUN chmod +x export-tokens.sh && mkdir -p /tokens

CMD ["./export-tokens.sh"]
