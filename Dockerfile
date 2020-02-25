FROM node:13-alpine

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
ADD . .

EXPOSE 8080

CMD ["npm", "start"]
