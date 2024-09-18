FROM amazon/aws-lambda-nodejs:18
WORKDIR ${LAMBDA_TASK_ROOT}

COPY package.json ./
RUN npm install --only=production
COPY index.js ./
COPY database.sql ./
COPY script.sql ./
COPY triggers.sql ./

CMD [ "index.handler" ]