FROM node:24-bookworm-slim AS frontend
WORKDIR /app
COPY client/package*.json ./client/
RUN npm ci --prefix client --no-audit --no-fund
COPY client ./client
COPY shared ./shared
ENV VITE_API_URL=/api
RUN npm --prefix client run build

FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv \
    && python3 -m venv /opt/cv-parser \
    && /opt/cv-parser/bin/pip install --no-cache-dir pypdf==6.21.4 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server/package*.json ./server/
RUN npm ci --prefix server --omit=dev --no-audit --no-fund
COPY server/src ./server/src
COPY server/parsers ./server/parsers
COPY shared ./shared
COPY --from=frontend /app/client/dist ./client/dist
ENV NODE_ENV=production HOST=0.0.0.0 SERVE_CLIENT=true CV_PARSER_PYTHON=/opt/cv-parser/bin/python
USER node
WORKDIR /app/server
CMD ["node", "src/index.js"]
