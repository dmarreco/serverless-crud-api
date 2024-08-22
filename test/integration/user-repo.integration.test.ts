import { UserRepo } from '../../src/user-repo';
import { User } from '../../src/user-entity';

const userRepo = new UserRepo();

describe('user-repo', () => {

    beforeAll(() => {
        const env = 'local';

        process.env['IS_OFFLINE'] = 'true';
        process.env['AWS_REGION'] = 'us-east-1';
        process.env['USER_TABLE'] = `${env}.user`;
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

    });
});