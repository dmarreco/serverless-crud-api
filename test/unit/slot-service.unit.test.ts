import UserRepo from '../../src/user-repo';
import User from '../../src/user-entity';

import UserService from '../../src/user-service';
import { NoEntityFoundException } from '../../src/lib/business-exceptions';

process.env.USER_TABLE = 'mock';
process.env.LOG_LEVEL = 'ERROR'; //TODO implement disable logs and disable it for tests

const mockUser = {
  id: '001',
  version: 1,
  startTime: new Date('2024-01-17T20:00:00.000Z'),
  endTime: new Date('2024-01-17T21:00:00.000Z'),
  status: 'available'
} as User;

describe('Unit Tests (Mocked Dependencies): User API Lambda Service', () => {
  const userService = new UserService();

  describe('#get', () => {
    let userRepoGetMock: { mockResolvedValueOnce: (arg0: User | undefined) => void };

    beforeAll(() => {
      userRepoGetMock = jest.spyOn(UserRepo.prototype, 'get');
    });

    it('Retrieving an existing User should return the expected User', async () => {
      userRepoGetMock.mockResolvedValueOnce(mockUser);
      const userId = '001';

      const response = await userService.get(userId);

      expect(response).toEqual(mockUser);
    });

    it('Retrieving a non existing User should throw NoEntityFoundException', async () => {
      userRepoGetMock.mockResolvedValueOnce(undefined);
      const userId = 'not_an_existing_entity_id';

      try {
        await userService.get(userId);
      } catch (e) {
        expect(e instanceof NoEntityFoundException).toBeTruthy();

        return;
      }
      fail('Expected error but none was thrown');
    });

    //TODO implement more scenarios for #get, like passing a null id and expecting MissingParameterException
  });

  //TODO implement more scenarios for other service methods
});
