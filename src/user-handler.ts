// import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from 'aws-lambda';

// import log from './lib/log';
// import { ApplicationException, BadRequest, MissingParameterException } from './lib/business-exceptions';



// export const get: Handler = async (
//   event: APIGatewayProxyEventV2,
//   _context: Context
// ): Promise<APIGatewayProxyStructuredResultV2> => {
//   const userService = new UserService();

//   log.debug('User Handler Event Received!', event);

//   const userId = event.pathParameters?.id;

//   try {
//     const user = await userService.get(userId);

//     return {
//       statusCode: 200,
//       body: JSON.stringify(user)
//     };
//   } catch (error) {
//     if (error instanceof ApplicationException) {
//       return {
//         statusCode: error.httpStatusCode,
//         body: error.message
//       };
//     } else {
//       log.error('Unhandled backed error', {}, error as Error);
//       throw error;
//     }
//   }
// };

// export const create: Handler = async (
//   event: APIGatewayProxyEventV2,
//   _context: Context
// ): Promise<APIGatewayProxyStructuredResultV2> => {
//   const userService = new UserService();

//   log.debug('User Handler Event Received!', event);

//   if (event.body == null) throw new MissingParameterException('User expected in request body');

//   const user = JSON.parse(event.body);

//   try {
//     const created = await userService.create(user);

//     return {
//       statusCode: 200,
//       body: JSON.stringify(created)
//     };
//   } catch (error) {
//     if (error instanceof ApplicationException) {
//       return {
//         statusCode: error.httpStatusCode,
//         body: error.message
//       };
//     } else {
//       log.error('Unhandled backed error', {}, error as Error);
//       throw error;
//     }
//   }
// };

// export const update: Handler = async (
//   event: APIGatewayProxyEventV2,
//   _context: Context
// ): Promise<APIGatewayProxyStructuredResultV2> => {
//   const userService = new UserService();

//   log.debug('User Handler Event Received!', event);

//   if (event.body == null) throw new MissingParameterException('User expected in request body');

//   const user = JSON.parse(event.body);

//   const userId = event.pathParameters?.id;

//   if (userId == null) throw new MissingParameterException('entity id must be informed in API path');

//   // this is not a business rule validation really, but rather a API contract rule, so it is implemented in the handler.
//   if (user.id != null && user.id !== userId)
//     throw new BadRequest('there is an Id in body that is different from the entity being updated');

//   user.id = userId;

//   try {
//     const updated = await userService.update(user);

//     return {
//       statusCode: 200,
//       body: JSON.stringify(updated)
//     };
//   } catch (error) {
//     if (error instanceof ApplicationException) {
//       return {
//         statusCode: error.httpStatusCode,
//         body: error.message
//       };
//     } else {
//       log.error('Unhandled backed error', {}, error as Error);
//       throw error;
//     }
//   }
// };

// export const query: Handler = async (
//   event: APIGatewayProxyEventV2,
//   _context: Context
// ): Promise<APIGatewayProxyStructuredResultV2> => {
//   const userService = new UserService();

//   log.debug('User Handler Event Received!', event);

//   if (event.queryStringParameters == null || event.queryStringParameters.date == null) {
//     throw new MissingParameterException('Must inform parameter date');
//   }

//   const date = new Date(event.queryStringParameters.date);
//   const timeframe = event.queryStringParameters.timeframe;

//   try {
//     const queryResult = await userService.query(date, timeframe);

//     return {
//       statusCode: 200,
//       body: JSON.stringify(queryResult)
//     };
//   } catch (error) {
//     if (error instanceof ApplicationException) {
//       return {
//         statusCode: error.httpStatusCode,
//         body: error.message
//       };
//     } else {
//       log.error('Unhandled backed error', {}, error as Error);
//       throw error;
//     }
//   }
// };
