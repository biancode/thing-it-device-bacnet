import * as winston from 'winston';

import { LoggerConfig } from '../configs';

winston.configure(LoggerConfig);

export const logger = winston;

export abstract class Logger {
    abstract logInfo(...messages: any[]): void;
    abstract logDebug(...messages: any[]): void;
    abstract logError(...messages: any[]): void;
}
