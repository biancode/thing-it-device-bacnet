import { BaseError } from './base.error';

export class BACnetError extends BaseError {
    public name: string = 'BACnetError';
}
