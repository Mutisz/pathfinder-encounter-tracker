FROM mcr.microsoft.com/devcontainers/typescript-node:5-24-bookworm

RUN mkdir -p /home/node/.claude \
    && chown -R node:node /home/node/.claude \
    && npm install -g npm@12.1.0 \
    && git config --system --add safe.directory /workspaces/pathfinder-encounter-tracker
