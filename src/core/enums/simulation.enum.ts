export namespace Simulation {
    export enum ConfirmedRequestService {
        ReadProperty,
        WriteProperty,
        SubscribeCOV,
        UnsubscribeCOV,
    }

    export enum UnsonfirmedRequestService {
        WhoIsBroadcast,
        WhoIsUnicast,
    }

    export enum FlowType {
        Error,
        Response,
    }
}
