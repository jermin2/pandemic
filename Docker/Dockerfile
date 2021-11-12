FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to enure both package.json AND package-lock.json are copied where available
COPY package*.json ./

RUN npm install
# For production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 80

CMD [ "npm", "start" ]