FROM node:20-slim

# Install Typst
RUN apt-get update && apt-get install -y curl xz-utils && \
    curl -sL https://github.com/typst/typst/releases/download/v0.11.1/typst-x86_64-unknown-linux-musl.tar.xz -o /tmp/typst.tar.xz && \
    tar -xf /tmp/typst.tar.xz -C /tmp && \
    mv /tmp/typst-x86_64-unknown-linux-musl/typst /usr/local/bin/ && \
    rm -rf /tmp/typst* && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application files
COPY . .

# Create exports directory
RUN mkdir -p Exports

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]
