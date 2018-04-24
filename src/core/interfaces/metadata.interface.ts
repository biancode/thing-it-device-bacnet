
export interface IMasterMetadata {
    plugin: string;
    label: string;
    family: string;
    actorTypes: any[];
    sensorTypes: any[];
    events: IEvent[];
    services: IService[];
    state: IState[];
    configuration: IConfiguration[];
}

export interface ISlaveMetadata {
    plugin: string;
    label: string;
    role: string;
    family: string;
    deviceTypes: string[];
    events: IEvent[];
    services: IService[];
    state: IState[];
    configuration: IConfiguration[];
}

export interface IState {
    id: string;
    label: string;
    type: IStateType;
}
export interface IStateType {
    id: string;
}

export interface IConfiguration {
    id: string;
    label: string;
    type: IConfigurationType;
    defaultValue: any;
}
export interface IConfigurationType {
    id: string;
}

export interface IEvent {
    id: string;
    label: string;
}

export interface IService {
    id: string;
    label: string;
}
