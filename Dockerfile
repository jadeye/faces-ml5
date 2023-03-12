FROM node:16.18.1-alpine


WORKDIR /home/faces_ml5

COPY ./package.json .


RUN npm install 

COPY . .

EXPOSE 5000
CMD ["npm" , "start"]

