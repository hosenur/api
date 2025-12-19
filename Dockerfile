FROM oven/bun:slim AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY bun.lock bun.lock

RUN bun install --production

COPY ./src ./src

FROM oven/bun:slim

WORKDIR /app

COPY --from=build /app/node_modules node_modules
COPY --from=build /app/src src
COPY --from=build /app/package.json package.json

ENV NODE_ENV=production

CMD ["bun", "run", "src/main.ts"]

EXPOSE 8080