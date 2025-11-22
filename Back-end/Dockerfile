# Use official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of your backend code
COPY . .

# Set environment
ENV NODE_ENV=production

# Expose the port backend listens on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"] 
