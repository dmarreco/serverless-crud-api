import DomainEntity from './lib/domain-entity';

export default class User implements DomainEntity {
  public id?: string;
  public version?: number;
  public status: 'available' | 'not_available';
  public startDate?: string;
  public endTime: Date;
  public startTime: Date;
}
