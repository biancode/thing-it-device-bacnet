import * as winston from 'winston';

import { LoggerConfig } from '../configs';

winston.configure(LoggerConfig);

export const logger = winston;

export abstract class Logger {
    abstract logInfo(message: string): void;
    abstract logDebug(message: string): void;
    abstract logError(message: string): void;
}
