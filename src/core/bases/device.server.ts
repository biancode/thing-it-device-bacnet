import * as _ from 'lodash';

export class DeviceServer {
    // Device configuration
    public configuration: any;
    // Device state
    public state: any;
    public simulated: boolean = false;
    // Contains instances of TID actors
    public actors: any[];

    /*
     * Master Application
     */

    /**
     * publishEvent - stub of real method from master application.
     * Proposed logic: emites the event with "eventName" name (notifies the
     * master application about new event).
     *
     * @param {string} eventName - name of Event
     * @return {void}
     */
    public publishEvent (eventName: string): void {
    }

    /**
     * isSimulated - stub of real method from master application.
     * Proposed logic: returns "simulation" state, which user has configured
     * in plugin config.
     *
     * @return {boolean}
     */
    public isSimulated (): boolean {
        return this.simulated;
    }

    /**
     * publishStateChange - stub of real method from master application.
     * Proposed logic: notifies the master application about updating of the state.
     *
     * @return {void}
     */
    public publishStateChange (): void {
    }

    /**
     * findActor - stub of real method from master application.
     * Proposed logic: finds the actor with "id" in "actor" array.
     *
     * @return {T}
     */
    public findActor<T> (id: string): T {
        return null;
    }

    /**
     * logInfo - stub of real method from master application.
     * Proposed logic: shows an information message in the console.
     *
     * @param  {any[]} messages - array with info messages (one line)
     * @return {void}
     */
    public logInfo (...messages: any[]): void {
        console.info(...messages);
    }

    /**
     * logError - stub of real method from master application.
     * Proposed logic: shows an error message in the console.
     *
     * @param  {any[]} messages - array with error messages (one line)
     * @return {void}
     */
    public logError (...messages: any[]): void {
        console.error(...messages);
    }

    /**
     * logDebug - stub of real method from master application.
     * Proposed logic: shows a debug message in the console.
     *
     * @param  {any[]} messages - array with debug messages (one line)
     * @return {void}
     */
    public logDebug (...messages: any[]): void {
        console.log(...messages);
    }
}
