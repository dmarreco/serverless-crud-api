import DomainEntity from './lib/domain-entity';

export class User implements DomainEntity {
  readonly id?: string;
  readonly version?: number;
  readonly name: string;
  readonly email: string;
}
