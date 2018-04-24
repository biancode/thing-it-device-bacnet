
export interface ICommonState {
    initialized?: boolean;
}
export interface ICommonConfig {
}


/**
 * Controllers
 */
export interface IControllerState extends ICommonState {
}
export interface IControllerConfig extends ICommonConfig {
}

export interface IBACnetDeviceControllerState extends IControllerState {
}
export interface IBACnetDeviceControllerConfig extends IControllerConfig {
}


/**
 * Sensors
 */



/**
 * Actors
 */
export interface IActorState extends ICommonState {
}
export interface IActorConfig extends ICommonConfig {
}

export interface IAnalogInputActorState extends IActorState {
}
export interface IAnalogInputActorConfig extends IActorConfig {
}

export interface IAnalogValueActorState extends IActorState {
}
export interface IAnalogValueActorConfig extends IActorConfig {
}

export interface IBinaryInputActorState extends IActorState {
}
export interface IBinaryInputActorConfig extends IActorConfig {
}

export interface IBinaryValueActorState extends IActorState {
}
export interface IBinaryValueActorConfig extends IActorConfig {
}

export interface IBinaryLightActorState extends IActorState {
}
export interface IBinaryLightActorConfig extends IActorConfig {
}

export interface IJalousieActorState extends IActorState {
}
export interface IJalousieActorConfig extends IActorConfig {
}

export interface IJalousieSimpleActorState extends IActorState {
}
export interface IJalousieSimpleActorConfig extends IActorConfig {
}

export interface ILightActorState extends IActorState {
}
export interface ILightActorConfig extends IActorConfig {
}

export interface IMultiStateInputActorState extends IActorState {
}
export interface IMultiStateInputActorConfig extends IActorConfig {
}

export interface IMultiStateValueActorState extends IActorState {
}
export interface IMultiStateValueActorConfig extends IActorConfig {
}

export interface IRoomControlActorState extends IActorState {
}
export interface IRoomControlActorConfig extends IActorConfig {
}

export interface IThermostatActorState extends IActorState {
}
export interface IThermostatActorConfig extends IActorConfig {
}
