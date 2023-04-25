const AWS = require('aws-sdk');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

const decoratorValidator = require('./utils/decoratosValidator');
const globalEnum = require('./utils/globalEnum');

class Handler {
  constructor({ dynamoDbSvc }) {
    this.dynamoDbSvc = dynamoDbSvc;
    this.dynamoDbTable = process.env.DYNAMODB_TABLE;
  }

  async main({ body }) {
    try {
      const data = body;
      const dbParams = this.prepareData(data);
      await this.insertItem(dbParams);

      return this.handlerSucess(dbParams.Item);
    } catch (error) {
      console.log('deu ruim:', error.stack);
      return this.handlerError({ statusCode: 500 });
    }
  }

  async insertItem(params) {
    return this.dynamoDbSvc.put(params).promise();
  }

  prepareData(data) {
    const params = {
      TableName: this.dynamoDbTable,
      Item: {
        ...data,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      },
    };

    return params;
  }

  static validator() {
    return Joi.object({
      nome: Joi.string().max(100).min(2).required(),
      poder: Joi.string().max(20),
    });
  }

  handlerSucess(data) {
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  }

  handlerError({ statusCode }) {
    return {
      statusCode: statusCode || 500,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: "Couldn't create item!!",
    };
  }
}

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const handler = new Handler({
  dynamoDbSvc: dynamoDB,
});

module.exports = decoratorValidator(
  handler.main.bind(handler),
  Handler.validator(),
  globalEnum.ARG_TYPE.BODY
);
