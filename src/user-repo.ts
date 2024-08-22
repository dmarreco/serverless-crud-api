import { DynamoRepository } from '../src/lib/dynamo-repository';
import { getRequiredEnvVar } from '../src/lib/config';

import { User } from '../src/user-entity';

export class UserRepo extends DynamoRepository<User> {
  constructor() {
    super(() => getRequiredEnvVar('USER_TABLE'));
  }
}