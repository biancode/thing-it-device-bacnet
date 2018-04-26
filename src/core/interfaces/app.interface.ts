export abstract class Logger {
    abstract logInfo(message: string): void;
    abstract logDebug(message: string): void;
    abstract logError(message: string): void;
}

export interface IBACnetAddressInfo {
    address: string;
    port: number;
}


/* Application Config */
export interface IAppConfig {
    server: IServerSocketConfig;
}

/* Socket Server */
import { OutputSocket } from '../sockets';

export interface IServerSocketConfig {
    port: number;
    sequence: ISequenceConfig;
}

export interface IServerSocketResponse {
    message: Buffer;
    socket: OutputSocket;
}

/* BACnet Manager */
import { ILayer } from '../bacnet/interfaces';

export interface IBACnetResponse {
    layer: ILayer;
    server: IServerSocketResponse;
}

/* Sequence Manager Config */
export interface ISequenceConfig {
    thread: number;
    delay: number;
}

/* BACnet Service Manager Config */
export interface IBACnetServiceManagerConfig {
    socket: OutputSocket;
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
