
export interface IBACnetAddressInfo {
    address: string;
    port: number;
}

/**
 * Configuration
 */

/* Application Config */
export interface IAppConfig {
    server: IServerConfig;
    bacnet?: IBACnetConfig;
}

/* BACnet config */
export interface IBACnetConfig {
    edeFilePath: string;
}

/* Server config */
export interface IServerConfig {
    port: number;
    outputSequence: ISequenceConfig;
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
