import { BaseError } from './base.error';

export class APIError extends BaseError {
    public name: string = 'APIError';
}
