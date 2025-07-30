FROM alpine:latest AS builder

RUN apk add --no-cache nodejs npm

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production
COPY . .
RUN npm run build


FROM node:alpine

ARG PORT=3000
ENV PORT=${PORT}

WORKDIR /app
RUN apk add --no-cache nodejs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/views ./views

EXPOSE 3000

CMD ["node", "dist/index.js"]
