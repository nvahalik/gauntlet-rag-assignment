FROM node:18

WORKDIR /app

# Install dependencies
#COPY package*.json ./
RUN npm install

# Copy application files
#COPY . .

EXPOSE 3000

# Development mode with hot reload
CMD ["npm", "run", "dev"]
