FROM mcr.microsoft.com/devcontainers/javascript-node:1-20-bookworm

# Install base tooling needed for the monorepo.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally.
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /workspaces/Black-Frame-Mobile
