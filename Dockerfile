FROM node:24-alpine3.21 AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install --prefer-offline --no-audit --progress=false

COPY src ./src
COPY proto ./proto

RUN npm run build

FROM node:24-alpine3.21 AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/proto ./proto

RUN npm install --omit=dev --prefer-offline --no-audit --progress=false

CMD ["node", "dist/main"]