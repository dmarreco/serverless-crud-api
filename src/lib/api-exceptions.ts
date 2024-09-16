export class BadRequestException extends Error {
    statusCode = 422;

    constructor() {
        super('Bad request parameters provided');
    }
}