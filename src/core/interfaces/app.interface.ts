import { Moment } from 'moment';
import { Interfaces, Types } from 'bacnet-logic';

import * as Enums from '../enums';

export namespace BACnetResponse {
    export interface Config {
        iAm: ResponseConfig;
        readProperty: ResponseConfig;
    }

    export interface ResponseConfig {
        timeout?: number;
    }
}

/* Socket Server */
import { OutputSocket, ServerSocket } from '../sockets';

export namespace ServerSocket {
    export interface Config {
        port: number;
        sequence: SequenceManager.Config;
    }

    export interface AddressInfo {
        address: string;
        port: number;
    }

    export interface Response {
        message: Buffer;
        socket: OutputSocket;
    }

    export interface Request {
        rinfo: AddressInfo;
    }
}

/* BACnet Flow Manager */

export interface AppConfig {
    response: BACnetResponse.Config;
    server: ServerSocket.Config;
    manager: ManagerConfig;
}

export interface ManagerConfig {
    service: ServiceManager.Config;
    flow: FlowManager.Config;
}

export namespace SequenceManager {
    export interface Config {
        thread: number;
        delay: number;
    }

    export interface Handler {
        object: any;
        method: any;
        params: any[];
    }

    export interface State {
        free?: boolean;
    }
}

export namespace FlowManager {
    export interface Config {
    }

    export interface Response {
        layer: Interfaces.Layers;
        socket: OutputSocket;
    }
}

export namespace ServiceManager {
    export interface Config {
        covTimer: COVTimer.Config;
        dest: ServerSocket.AddressInfo;
    }
}

export namespace COVTimer {
    export interface Config {
        lifetime: number;
        period: number;
    }

    export interface Data {
        prev: Moment;
        next: Moment;
    }
}

export namespace BACnet {
    export interface COVNotificationResponse <T> {
        presentValue: T;
        statusFlags: Types.BACnetStatusFlags;
    }
}

/**
 * Alias
 */

export interface IAliasMapElement <T> {
    alias: string|string[];
    value?: T;
}

export namespace Simulation {

    /**
     * Data interface. Each API service emits a data using this interface.
     */
    export interface APINotification {
        type: Enums.Simulation.ConfirmedRequestService
            | Enums.Simulation.UnsonfirmedRequestService;
        params: any;
    }
}
