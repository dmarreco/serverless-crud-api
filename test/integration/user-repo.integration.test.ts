import { UserRepo } from '../../src/user-repo';
import { User } from '../../src/user-entity';
import { deleteAllUsers, seedUsers } from './seed-data/user-seeder';
import { OptimisticLockingException, PersistenceException, UnexistingEntityException } from '../../src/lib/dynamo-repository';

const userRepo = new UserRepo();

describe('user-repo', () => {

    beforeAll(() => {
        const env = 'local';

        process.env['IS_OFFLINE'] = 'true';
        process.env['AWS_REGION'] = 'us-east-1';
        process.env['USER_TABLE'] = `${env}.user`;
    });

    beforeEach(async () => {
        await deleteAllUsers();
        await seedUsers();
    });

    describe('#get', () => {
        test('get existing user id should return expected User instance', async () => {
            const userId = '001';

            const user = await userRepo.get(userId);

            expect(user).toMatchObject({
                id: '001',
                version: 1,
                name: 'James Logan Howlett',
                email: 'wolverine@xmen.org'
            } as User)

        });
        test('get non existing should throw UnexistingEntityException', async () => {
            const userId = 'unexistingUserId';

            const act = async () => await userRepo.get(userId);

            expect(act).rejects.toThrow(UnexistingEntityException);
        })
    });

    describe('#list', () => {

        test('list with no parameters should return 3 users with expected ids', async () => {
            const users = await userRepo.list();

            expect(users.map(u => u.id)).toEqual(['011', '001', '002']);
        });

        test('list with page 1 and pageSize 2 parameter returns first two records only', async () => {
            const page = 1;
            const pageSize = 2;
            const users = await userRepo.list(page, pageSize);

            expect(users.length).toBe(2);
            expect(users.map(u => u.id)).toEqual(['011', '001']);
        });

        test('list with page 2 and pageSize 1 returns last one of three existing records', async () => {
            const page = 3;
            const pageSize = 1;
            const users = await userRepo.list(page, pageSize);

            expect(users.length).toBe(1);
            expect(users[0].id).toBe('002');
        });

        test('list with undefined value for page and defined for pageSize will default to first page', async () => {
            const page = undefined;
            const pageSize = 2;
            const users = await userRepo.list(page, pageSize);

            expect(users.length).toBe(2);
            expect(users.map(u => u.id)).toEqual(['011', '001']);
        });

        test('list with no users returns an empty array', async () => {
            await deleteAllUsers();

            // Assuming there's a way to clear the database before running this test
            const users = await userRepo.list();

            expect(users).toHaveLength(0);

            await seedUsers();
        });

    });

    describe('#create', () => {
        test('create new user should return the newly created user', async () => {
            const newUser = {
                name: 'Natalia Alianovna Romanoff',
                email: 'black.widow@shield.org'
            };

            const user = await userRepo.create(newUser);

            expect(user).toMatchObject({
                id: expect.any(String),
                version: expect.any(Number),
                name: 'Natalia Alianovna Romanoff',
                email: 'black.widow@shield.org'
            } as User);
        });
    });

    describe('#update', () => {
        test('update existing user should return the updated user', async () => {
            const updatedUser = {
                id: '001',
                version: 1,
                name: 'Logan',
                email: 'wolverine@xmen.can'
            };

            const user = await userRepo.update(updatedUser);

            expect(user).toMatchObject({
                id: '001',
                version: expect.any(Number),
                name: 'Logan',
                email: 'wolverine@xmen.can'
            } as User);
        });

        test('update non existing user should throw UnexistingEntityEception', async () => {
            const updatedUser = {
                id: 'unexistingUserId',
                version: 1,
                name: 'Logan',
                email: 'XXXXXXXXXXXXXXXXXX'
            };

            await expect(userRepo.update(updatedUser)).rejects.toThrow(UnexistingEntityException);
        });

        test('update transitive user should throw PersistenceException', async () => {
            const updatedUser = {
                version: 1,
                name: 'Logan',
                email: 'XXXXXXXXXXXXXXXXXX'
            };

            await expect(userRepo.update(updatedUser)).rejects.toThrow(PersistenceException);
        });

        test('update a prior version should throw OptimisticLockingException', async () => {
            const updatedUser = {
                id: '001',
                version: 0,
                name: 'Logan',
                email: 'wolverine@xmen.can'
            };

            await expect(userRepo.update(updatedUser)).rejects.toThrow(OptimisticLockingException);
        });

        test('update without version should throw PersistenceException', async () => {
            const updatedUser = {
                id: '001',
                name: 'Logan',
                email: 'wolverine@xmen.can'
            };

            await expect(userRepo.update(updatedUser)).rejects.toThrow(PersistenceException);
        });
    });
    
});
