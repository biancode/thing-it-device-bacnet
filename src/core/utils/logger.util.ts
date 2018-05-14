
export abstract class Logger {
    abstract logInfo(...messages: any[]): void;
    abstract logDebug(...messages: any[]): void;
    abstract logError(...messages: any[]): void;
}
