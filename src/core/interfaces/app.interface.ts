export interface IBACnetAddressInfo {
    address: string;
    port: number;
}


/* Application Config */
export interface IAppConfig {
    response: IBACnetResponseConfig;
    server: IServerSocketConfig;
    manager: IManagerConfig;
}

export interface IBACnetResponseConfig {
    iAm: IResponseConfig;
    readProperty: IResponseConfig;
}

export interface IResponseConfig {
    timeout?: number;
}

export interface IManagerConfig {
    service: IBACnetServiceManagerConfig;
    flow: IBACnetFlowManagerConfig;
}

/* Socket Server */
import { OutputSocket, ServerSocket } from '../sockets';

export interface IServerSocketConfig {
    port: number;
    sequence: ISequenceConfig;
}

export interface IServerSocketResponse {
    message: Buffer;
    socket: OutputSocket;
}

export interface IOutputSocketConfig {
    rinfo: IBACnetAddressInfo;
}

/* BACnet Flow Manager */
import { Interfaces } from 'bacnet-logic';

export interface IBACnetResponse {
    layer: Interfaces.Layers;
    socket: OutputSocket;
}

/* Sequence Manager Config */
export interface ISequenceConfig {
    thread: number;
    delay: number;
}

/* BACnet Service Manager Config */
export interface IBACnetServiceManagerConfig {
    dest: IBACnetAddressInfo;
}

/* BACnet Flow Manager Config */
export interface IBACnetFlowManagerConfig {
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
