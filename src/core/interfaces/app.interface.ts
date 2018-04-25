
export abstract class Logger {
    abstract logInfo(message: string): void;
    abstract logDebug(message: string): void;
    abstract logError(message: string): void;
}

export interface IBACnetAddressInfo {
    address: string;
    port: number;
}

/**
 * Configuration
 */

/* Application Config */

export interface IAppConfig {
    server: IServerSocketConfig;
}

/* BACnet config */
export interface IBACnetConfig {
    edeFilePath: string;
}

/* Server config */
import { OutputSocket } from '../sockets';

export interface IServerSocketConfig {
    port: number;
    sequence: ISequenceConfig;
}

export interface IServerSocketResponse {
    message: Buffer;
    output: OutputSocket;
}

/* Sequence Manager Config */
export interface ISequenceConfig {
    thread: number;
    delay: number;
}

/**
 * Alias
 */

export interface IAliasMapElement <T> {
    alias: string|string[];
    value?: T;
}

/**
 * Managers
 */

/* Sequence Manager */
export interface ISequenceFlow {
    id: string;
    object: any;
    method: any;
    params: any[];
}

export interface IDistribution {
    min: number;
    max: number;
}
