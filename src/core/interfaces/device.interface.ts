
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
    name: string;
    description: string;
    vendor: string;
    model: string;
    softwareVersion: string;
}
export interface IBACnetDeviceControllerConfig extends IControllerConfig {
    ipAddress: string;
    ipMatchRequired: boolean;
    url: string;
    urlLookupRequired: boolean;
    port: number;
    deviceId: number;
    deviceIdMatchRequired: number;
    vendorId: number;
    vendorIdMatchRequired: boolean;
    unicastWhoIsIP?: string;
    priority: number;
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

export interface IAnalogActorState extends IActorState {
    presentValue: number;
    alarmValue: boolean;
    outOfService: boolean;
    min: number;
    max: number;
}
export interface IAnalogActorConfig extends IActorConfig {
    objectId: string;
    objectType: string;
    objectName: string;
    description: string;
    unit: string;
}
export interface IAnalogInputActorState extends IAnalogActorState {
}
export interface IAnalogInputActorConfig extends IAnalogActorConfig {
}
export interface IAnalogValueActorState extends IAnalogActorState {
}
export interface IAnalogValueActorConfig extends IAnalogActorConfig {
    minValue: number;
    maxValue: number;
}

export interface IBinaryActorState extends IActorState {
    presentValue: boolean;
    alarmValue: boolean;
    outOfService: boolean;
}
export interface IBinaryActorConfig extends IActorConfig {
    objectId: string;
    objectType: string;
    objectName: string;
    description: string;
}
export interface IBinaryInputActorState extends IBinaryActorState {
}
export interface IBinaryInputActorConfig extends IBinaryActorConfig {
}
export interface IBinaryValueActorState extends IBinaryActorState {
}
export interface IBinaryValueActorConfig extends IBinaryActorConfig {
}
export interface IBinaryLightActorState extends IActorState {
    lightActive: boolean;
}
export interface IBinaryLightActorConfig extends IActorConfig {
    lightActiveObjectId: number;
    lightActiveObjectType: string;
}

export interface IJalousieActorState extends IActorState {
    position: number;
    rotation: number;
}
export interface IJalousieActorConfig extends IActorConfig {
    positionFeedbackObjectId: number;
    positionFeedbackObjectType: string;
    positionModificationObjectId: number;
    positionModificationObjectType: string;
    positionStepSize: number;
    rotationFeedbackObjectId: number;
    rotationFeedbackObjectType: string;
    rotationModificationObjectId: number;
    rotationModificationObjectType: string;
    rotationUpValue: number;
    rotationDownValue: number;
    rotationStepSize: number;
    actionObjectId: number;
    actionObjectType: string;
    actionGoValue: number;
    actionStopValue: number;
}

export interface IJalousieSimpleActorState extends IActorState {
    motionDirection: number;
    stopValue: boolean;
}
export interface IJalousieSimpleActorConfig extends IActorConfig {
    motionDirectionObjectId: number;
    motionDirectionObjectType: string;
    stopValueObjectId: number;
    stopValueObjectType: string;
    stepDuration: number;
}

export interface ILightActorState extends IActorState {
    lightActive: boolean;
    dimmerLevel: number;
}
export interface ILightActorConfig extends IActorConfig {
    levelFeedbackObjectId: number;
    levelFeedbackObjectType: string;
    levelModificationObjectId: number
    levelModificationObjectType: string;
    lightActiveFeedbackObjectId: number;
    lightActiveFeedbackObjectType: string;
    lightActiveModificationObjectId: number;
    lightActiveModificationObjectType: string;
    lightActiveModificationValueOn: number;
    lightActiveModificationValueOff: number;
}

export interface IMultiStateActorState extends IActorState {
    presentValue: number;
    presentValueText: string;
    stateText: string[];
    alarmValue: boolean;
    outOfService: boolean;
}
export interface IMultiStateActorConfig extends IActorConfig {
    objectId: string;
    objectType: string;
    objectName: string;
    description: string;
}
export interface IMultiStateInputActorState extends IMultiStateActorState {
}
export interface IMultiStateInputActorConfig extends IMultiStateActorConfig {
    states: number;
}
export interface IMultiStateValueActorState extends IMultiStateActorState {
}
export interface IMultiStateValueActorConfig extends IMultiStateActorConfig {
}

export interface IRoomControlActorState extends IActorState {
    setpoint: number;
    temperature: number;
}
export interface IRoomControlActorConfig extends IActorConfig {
    setpointFeedbackObjectId: number;
    setpointFeedbackObjectType: string;
    temperatureObjectId: number;
    temperatureObjectType: string;
    setpointModificationObjectId: number;
    setpointModificationObjectType: string;
}

export interface IThermostatActorState extends IActorState {
    setpoint: number;
    temperature: number;
    mode: string;
    heatActive: boolean;
    coolActive: boolean;
}
export interface IThermostatActorConfig extends IActorConfig {
    setpointFeedbackObjectId: number;
    setpointFeedbackObjectType: string;
    setpointModificationObjectId: number;
    setpointModificationObjectType: string;
    temperatureObjectId: number;
    temperatureObjectType: string;
    modeObjectId: number;
    modeObjectType: string;
}
