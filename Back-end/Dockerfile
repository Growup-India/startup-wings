FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Environment file (optional: handled via docker-compose too)
# COPY .env .env

EXPOSE 5000

CMD ["npm", "start"]
