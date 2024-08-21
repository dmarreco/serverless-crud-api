import User from './user-entity';
import UserRepo from './user-repo';
import * as BizExceptions from './lib/business-exceptions';

export default class UserService {
  private userRepo: UserRepo;

  constructor() {
    this.userRepo = new UserRepo();
  }

  /**
   * This funcion returns the day section of a given date
   * ex: "2024-01-17T20:00:00.000Z" => "2024-01-17"
   */
  private _extractDaySectionFromDateTime(_startTime: Date | string): string {
    let startTime: Date;

    if (_startTime instanceof Date) {
      startTime = _startTime;
    } else {
      startTime = new Date(_startTime);
    }

    return startTime.toISOString().substring(0, 10);
  }

  /**
   * This function, getWeekDates, takes a Date object as input, calculates the start of the week (Sunday),
   * and then iterates through the week, pushing each date to the result array. The result is an array containing
   * all the dates in the same week as the input date.
   */
  private _getWeekDates(inputDate: Date): string[] {
    const result: string[] = [];

    const date = new Date(inputDate);
    const dayOfWeek = date.getDay();
    // Calculate the difference between the input day and the start of the week (Sunday)
    const diff = date.getDate() - dayOfWeek;
    // Set the date to the first day of the week (Sunday)

    date.setDate(diff);

    // Iterate through the days of the week and push each date to the result array
    for (let i = 0; i < 7; i++) {
      result.push(this._extractDaySectionFromDateTime(date));
      date.setDate(date.getDate() + 1);
    }

    return result;
  }

  async get(id?: string): Promise<User> {
    if (id == null) throw new BizExceptions.MissingParameterException('User id is missing or invalid');

    const user = await this.userRepo.get(id);

    if (user == null) {
      throw new BizExceptions.NoEntityFoundException();
    }

    return user;
  }

  async create(_user: any): Promise<User> {
    if (_user.id != null) {
      throw new BizExceptions.BadRequest(
        'Trying to create an entity and providing an ID is not supported; either the id will be assigned by the server or you shout update instead of creating'
      );
    }

    const startDate = this._extractDaySectionFromDateTime(_user.startTime);

    const user = {
      ..._user,
      startDate
    } as User;

    return this.userRepo.create(user);
  }

  async update(_user: any): Promise<User> {
    const startDate = this._extractDaySectionFromDateTime(_user.startTime);

    const user = {
      ..._user,
      startDate
    } as User;

    return this.userRepo.update(user);
  }

  async query(date: Date, _timeframe?: string): Promise<User[]> {
    if (!(_timeframe === 'day' || _timeframe === 'week')) {
      throw new BizExceptions.BadRequest('timeframe param must be one of [day, week]');
    }

    const timeframe: 'day' | 'week' = _timeframe;

    if (timeframe === 'day') {
      const dayOfYear = this._extractDaySectionFromDateTime(date);

      return this.userRepo.query(dayOfYear, 'startDate', 'date-index');
    }

    let result: User[] = [];
    const weekDates = this._getWeekDates(date);

    for (const dayOfYear of weekDates) {
      const dayUsers: User[] = await this.userRepo.query(dayOfYear, 'startDate', 'date-index');

      result = result.concat(dayUsers);
    }

    return result;
  }
}
