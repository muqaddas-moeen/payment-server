# Specify base image
FROM node:18-alpine

# Specify working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# App listens on PORT (default 8080 in container)
ENV PORT=8080
ENV HOST=0.0.0.0

# Expose port 8080
EXPOSE 8080

# Run the app directly (more reliable in containers than npm start)
CMD ["node", "server.js"]
