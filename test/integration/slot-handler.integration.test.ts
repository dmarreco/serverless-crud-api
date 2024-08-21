import { APIGatewayProxyEventV2, Callback, Context } from 'aws-lambda';

import * as handler from '../../src/user-handler';
import UserRepo from '../../src/user-repo';

const context = {} as Context;
const callback = {} as Callback;

describe('Integration tests - User API Lambda Handler', () => {
  beforeAll(() => {
    process.env.IS_OFFLINE = 'true';
    process.env.STAGE = 'local';
    process.env.USER_TABLE = `${process.env.STAGE}.User`;
    process.env.LOG_LEVEL = 'ERROR'; //TODO implement disable logs and disable it for tests
    process.env.AWS_REGION = 'us-west-2';
  });

  describe('#get', () => {
    describe('Retrieving an existing id', () => {
      const existingUserId = '001';
      const testEvent = {
        pathParameters: {
          id: existingUserId
        }
      } as unknown as APIGatewayProxyEventV2;

      it('Returns http status code 200', async () => {
        const result = await handler.get(testEvent, context, callback);

        expect(result.statusCode).toStrictEqual(200);
      });

      it('Returns the expected user on the http response body', async () => {
        const expected = {
          id: '001',
          version: 1,
          startDate: '2024-01-17',
          startTime: '2024-01-17T20:00:00.000Z',
          endTime: '2024-01-17T21:00:00.000Z',
          status: 'available'
        };

        const result = await handler.get(testEvent, context, callback);

        expect(JSON.parse(result.body)).toEqual(expected);
      });
    });

    describe('Retrieving a non existing Id returns statusCode 404', () => {
      const nonExistingId = 'non_existing_id';
      const testEvent = {
        pathParameters: {
          id: nonExistingId
        }
      } as unknown as APIGatewayProxyEventV2;

      it('Returns statusCode 404', async () => {
        const result = await handler.get(testEvent, context, callback);

        expect(result.statusCode).toEqual(404);
      });
    });
  });

  describe('#create', () => {
    describe('Creating a valid user', () => {
      const createRequest = {
        startTime: '2022-01-17T20:00:00.000Z',
        endTime: '2022-01-17T21:00:00.000Z',
        status: 'available'
      };
      const testEvent = {
        body: JSON.stringify(createRequest)
      };

      it('Should return statusCode 200', async () => {
        const result = await handler.create(testEvent, context, callback);

        expect(result.statusCode).toStrictEqual(200);
      });

      it('Should return the created user with assigned id and version', async () => {
        const result = await handler.create(testEvent, context, callback);

        const user = JSON.parse(result.body);

        expect(user.id).toBeDefined();
        expect(user.version).toBeDefined();
      });

      it('Should be persisted in the repository', async () => {
        const result = await handler.create(testEvent, context, callback);

        const user = JSON.parse(result.body);

        const repo = new UserRepo();
        const persisted = await repo.get(user.id);

        expect(user).toEqual(persisted);
      });
    });
  }); // #create

  describe('#update', () => {
    describe('Updating a valid user', () => {
      it('Should return statusCode 200', async () => {
        const createRequest = {
          startTime: '2023-01-17T20:00:00.000Z',
          endTime: '2023-01-17T21:00:00.000Z',
          status: 'available'
        };
        const resp = await handler.create({ body: JSON.stringify(createRequest) }, context, callback);
        const savedUser = JSON.parse(resp.body);

        const testEvent = {
          pathParameters: { id: savedUser.id },
          body: JSON.stringify({
            ...savedUser,
            status: 'not_available'
          })
        };

        const result = await handler.update(testEvent, context, callback);

        expect(result.statusCode).toStrictEqual(200);
      });

      it('Should overwrite the previous version in the repository', async () => {
        const createRequest = {
          startTime: '2023-01-17T20:00:00.000Z',
          endTime: '2023-01-17T21:00:00.000Z',
          status: 'available'
        };
        const resp = await handler.create({ body: JSON.stringify(createRequest) }, context, callback);
        const created = JSON.parse(resp.body);

        const testEvent = {
          pathParameters: { id: created.id },
          body: JSON.stringify({
            ...created,
            status: 'not_available'
          })
        };
        const response = await handler.update(testEvent, context, callback);
        const updated = JSON.parse(response.body);

        const repo = new UserRepo();
        const persisted = await repo.get(created.id);

        //TODO Too many assertions for single scenario, should break it in smaller scenarios...
        expect(persisted?.version).toStrictEqual(updated.version);
        expect(created?.status).toStrictEqual('available');
        expect(persisted?.status).toStrictEqual('not_available');
        expect(updated).toEqual(persisted);
      });
    });
  }); // #update

  describe('#query', () => {
    describe('Query by day with sucess', () => {
      it('Should return all users in the day', async () => {
        const event = {
          queryStringParameters: {
            date: '2024-01-17',
            timeframe: 'day'
          }
        };

        const expected = [
          {
            id: '002',
            version: 1,
            startDate: '2024-01-17',
            startTime: '2024-01-17T21:00:00.000Z',
            endTime: '2024-01-17T22:00:00.000Z',
            status: 'not_available'
          },
          {
            id: '001',
            version: 1,
            startDate: '2024-01-17',
            startTime: '2024-01-17T20:00:00.000Z',
            endTime: '2024-01-17T21:00:00.000Z',
            status: 'available'
          }
        ];

        const result = await handler.query(event, context, callback);

        const users = JSON.parse(result.body);

        expect(result.statusCode).toStrictEqual(200);
        expect(users).toEqual(expected);
      });
    });

    describe('Query by week with sucess', () => {
      it('Should return all users in the week', async () => {
        const event = {
          queryStringParameters: {
            date: '2024-01-17',
            timeframe: 'week'
          }
        };

        const expected = [
          {
            id: '002',
            version: 1,
            startDate: '2024-01-17',
            startTime: '2024-01-17T21:00:00.000Z',
            endTime: '2024-01-17T22:00:00.000Z',
            status: 'not_available'
          },
          {
            id: '001',
            version: 1,
            startDate: '2024-01-17',
            startTime: '2024-01-17T20:00:00.000Z',
            endTime: '2024-01-17T21:00:00.000Z',
            status: 'available'
          },
          {
            id: '011',
            version: 1,
            startDate: '2024-01-18',
            startTime: '2024-01-18T20:00:00.000Z',
            endTime: '2024-01-18T21:00:00.000Z',
            status: 'available'
          }
        ];

        const result = await handler.query(event, context, callback);

        const users = JSON.parse(result.body);

        expect(result.statusCode).toStrictEqual(200);
        expect(users).toEqual(expected);
      });
    });
  });
});
