FROM node:24-bookworm-slim AS web
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN VITE_API_URL=/api npm run build

FROM node:24-bookworm-slim AS api
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production PORT=8080 WEB_DIST=/app/web UPLOAD_ROOT=/app/backend/uploads
WORKDIR /app/backend
COPY --from=api /build/backend/package.json ./
COPY --from=api /build/backend/node_modules ./node_modules
COPY --from=api /build/backend/dist ./dist
COPY --from=web /build/frontend/dist /app/web
COPY deploy/khoi-tao-mysql.cjs ./khoi-tao-mysql.cjs
COPY doan4_daugia_tieng_viet.sql ./schema.sql
RUN mkdir -p /app/backend/uploads && chown node:node /app/backend/uploads
USER node
EXPOSE 8080
CMD ["node", "dist/may-chu.js"]
