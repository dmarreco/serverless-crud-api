import DynamoRepository from './lib/dynamo-repository';
import User from './user-entity';

export default class UserRepo extends DynamoRepository<User> {
  constructor() {
    super('USER_TABLE');
  }
}
