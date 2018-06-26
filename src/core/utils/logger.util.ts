
import * as Enums from '../enums';

export class Logger {
    private loggerMethods: Map<Enums.LogLevel, any> = new Map();

    constructor (private tidDevice: any) {
        this.tidDevice.logLevel = 'debug';
    }

    /**
     * Sets the method name of the logger.
     *
     * @param  {Enums.LogLevel} methodName - name of the logger method
     * @param  {any} method - logger method
     * @return {void}
     */
    public setLogMethod (methodName: Enums.LogLevel, method: any): void {
        this.loggerMethods.set(methodName, method);
    }

    /**
     * Shows the log message with `Info` priority.
     *
     * @param  {...any} messages - log messages
     * @return {void}
     */
    public logInfo (...messages: any[]): void {
        this.log(Enums.LogLevel.Info, ...messages);
    }

    /**
     * Shows the log message with `Debug` priority.
     *
     * @param  {...any} messages - log messages
     * @return {void}
     */
    public logDebug (...messages: any[]): void {
        this.log(Enums.LogLevel.Debug, ...messages);
    }

    /**
     * Shows the log message with `Error` priority.
     *
     * @param  {...any} messages - log messages
     * @return {void}
     */
    public logError (...messages: any[]): void {
        this.log(Enums.LogLevel.Error, ...messages);
    }

    /**
     * Shows the log message with specific priority.
     *
     * @param  {Enums.LogLevel} methodName - name of the logger method
     * @param  {...any} messages - log messages
     * @return {void}
     */
    private log (methodName: Enums.LogLevel, ...messages: any[]) {
        const loggerMethod = this.loggerMethods.get(methodName);
        loggerMethod.apply(this.tidDevice, messages);
    }
}
