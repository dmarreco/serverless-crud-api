import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context, Handler } from 'aws-lambda';
import z from 'zod';

import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpResponseSerializer from '@middy/http-response-serializer';
import inputOutputLogger from '@middy/input-output-logger';
import { parser } from '@aws-lambda-powertools/parser/middleware';


// middy validator & http-json-body-parser gives us a parsed, validated body in the APIGatewayProxyEvent with type of <S>
// middy http-event-normalizer makes several fields on our ValidatedEvent NonNullable
interface NormalizedValidatedEvent<S> extends Omit<APIGatewayProxyEvent, 'body'> {
  queryStringParameters: NonNullable<APIGatewayProxyEvent['queryStringParameters']>;
  multiValueQueryStringParameters: NonNullable<APIGatewayProxyEvent['multiValueQueryStringParameters']>;
  pathParameters: NonNullable<APIGatewayProxyEvent['pathParameters']>;
  body: S;
}

// APIGatewayProxyEventHandler for our NormalizedValidatedEvent
export type CustomAPIGatewayProxyEventHandler<S> = Handler<NormalizedValidatedEvent<S>, APIGatewayProxyResult>;

export const middyfy = (
  handler: CustomAPIGatewayProxyEventHandler<never>,
  schema?: z.ZodSchema,
): middy.MiddyfiedHandler<NormalizedValidatedEvent<never>, APIGatewayProxyResult, Error, Context> => {

  handler.toString(); // TODO why?

  const middyfiedHandler =  middy(handler)
    .use(httpEventNormalizer())
    .use(inputOutputLogger())
    .use(httpErrorHandler())
    .use(httpResponseSerializer({
      serializers: [
        {
          regex: /^application\/xml$/,
          serializer: ({ body }) => `<message>${body}</message>`
        },
        {
          regex: /^application\/json$/,
          serializer: ({ body }) => JSON.stringify(body)
        },
        {
          regex: /^text\/plain$/,
          serializer: ({ body }) => body
        }
      ],
      defaultContentType: 'application/json'
    }));
  
  if (schema) {
    middyfiedHandler.use(parser({ schema }));
  }

  return middyfiedHandler;
};