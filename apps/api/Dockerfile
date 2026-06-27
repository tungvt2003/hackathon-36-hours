FROM node:20-alpine

WORKDIR /app

# Install deps (including devDeps for tsx + nest build)
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Generate Prisma client + build NestJS
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
