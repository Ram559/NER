FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/web/package.json apps/web/package.json
RUN npm install --workspace @ner/web --include-workspace-root

FROM deps AS build
WORKDIR /app
COPY apps/web apps/web
RUN npm run build --workspace @ner/web

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.output apps/web/.output
EXPOSE 3000
CMD ["node", "apps/web/.output/server/index.mjs"]
