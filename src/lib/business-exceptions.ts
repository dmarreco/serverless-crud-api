export abstract class ApplicationException {
  public httpStatusCode?: number;
  public message: string;

  constructor(defaultMessage: string, customMessage?: string, httpStatusCode?: number) {
    this.message = customMessage || defaultMessage;
    this.httpStatusCode = httpStatusCode;
  }
}

export class NoEntityFoundException extends ApplicationException {
  constructor(customMessage?: string) {
    super('No entity with the given id currently exists', customMessage, 404);
  }
}

export class MissingParameterException extends ApplicationException {
  constructor(customMessage?: string) {
    super('Missing parameter', customMessage, 422);
  }
}

export class BadRequest extends ApplicationException {
  constructor(customMessage?: string) {
    super('Request data is not acceptable', customMessage, 406);
  }
}

export class OptimisticLockException extends ApplicationException {
  constructor(customMessage?: string) {
    super('The record you are trying to write have been updated and there is a version conflict', customMessage, 409);
  }
}
