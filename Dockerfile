FROM alpine:latest AS builder

RUN apk add --no-cache nodejs npm

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --production


FROM alpine:latest

ARG PORT=3000
ENV PORT=${PORT}
ENV NODE_ENV=production

WORKDIR /app
RUN apk add --no-cache nodejs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/views ./views

EXPOSE ${PORT}

CMD ["node", "dist/index.js"]
