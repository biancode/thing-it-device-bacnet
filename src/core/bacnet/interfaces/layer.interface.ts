import {
    BACnetServiceTypes,
    BLVCFunction,
    BACnetConfirmedService,
    BACnetUnconfirmedService,
} from '../enums';

import {
    BACnetUnsignedInteger,
    BACnetObjectId,
    BACnetTypeBase,
} from '../types';

import * as BACnetTypes from '../types';

import { IBACnetPropertyValue } from './bacnet.interface';

export interface ILayer {
    blvc: ILayerBLVC;
    npdu: ILayerNPDU;
    apdu: ILayerAPDU;
}

/*
 * BLVC Layer
 */
export interface ILayerBLVC {
    type: number;
    func: BLVCFunction;
    length: number;
    npdu: ILayerNPDU;
}

/*
 * NPDU Layer
 */
export interface ILayerNPDU {
    version: number;
    control: ILayerNPDUControl;
    dest: ILayerNPDUNetworkDest;
    src: ILayerNPDUNetworkSrc;
    apdu: ILayerAPDU;
}

export interface ILayerNPDUControl {
    noApduMessageType: boolean;
    reserved1: number;
    destSpecifier: boolean;
    reserved2: number;
    srcSpecifier: boolean;
    expectingReply: boolean;
    priority1: number;
    priority2: number;
}

export interface ILayerNPDUNetwork {
    networkAddress: number;
    macAddressLen: number;
    macAddress?: string;
}

export interface ILayerNPDUNetworkDest
        extends ILayerNPDUNetwork {
    hopCount?: number;
}

export interface ILayerNPDUNetworkSrc
        extends ILayerNPDUNetwork {
}


/*
 * APDU Layer
 */
export type ILayerAPDU = ILayerConfirmedReq | ILayerUnconfirmedReq
    | ILayerComplexACK | ILayerSimpleACK;

/*
 * Confirmed Request APDU Layer
 */
export interface ILayerConfirmedReq {
    type: BACnetServiceTypes;
    seg: boolean;
    mor: boolean;
    sa: boolean;
    maxSegs: number;
    maxResp: number;
    invokeId: number;
    serviceChoice: BACnetConfirmedService;
    service: ILayerConfirmedReqService;
}

export type ILayerConfirmedReqService = ILayerConfirmedReqServiceReadProperty
    | ILayerConfirmedReqServiceSubscribeCOV
    | ILayerConfirmedReqServiceWriteProperty;

export interface ILayerConfirmedReqServiceReadProperty {
    objId: BACnetTypes.BACnetObjectId;
    propId: BACnetTypes.BACnetEnumerated;
}

export interface ILayerConfirmedReqServiceSubscribeCOV {
    objId: BACnetTypes.BACnetObjectId;
    subscriberProcessId: BACnetTypes.BACnetUnsignedInteger;
    issConfNotif: BACnetTypes.BACnetBoolean;
    lifeTime: BACnetTypes.BACnetUnsignedInteger;
}

export interface ILayerConfirmedReqServiceWriteProperty {
    objId: BACnetTypes.BACnetObjectId;
    prop: IBACnetPropertyValue;
}

/*
 * Unconfirmed Request APDU Layer
 */
export interface ILayerUnconfirmedReq {
    type: BACnetServiceTypes;
    serviceChoice: BACnetUnconfirmedService;
    service: ILayerUnconfirmedReqService;
}

export type ILayerUnconfirmedReqService = ILayerUnconfirmedReqServiceIAm
    | ILayerUnconfirmedReqServiceWhoIs;

export interface ILayerUnconfirmedReqServiceIAm {
    objId: BACnetTypes.BACnetObjectId;
    maxAPDUlength: BACnetTypes.BACnetUnsignedInteger;
    segmSupported: BACnetTypes.BACnetEnumerated;
    vendorId: BACnetTypes.BACnetUnsignedInteger;
}

export interface ILayerUnconfirmedReqServiceWhoIs {
}
export interface ILayerUnconfirmedReqServiceCOVNotification {
    // Identify the process within the COV client.
    subProcessId: BACnetTypes.BACnetUnsignedInteger;
    // Device that initiated the `COV Notification` service request
    devId: BACnetTypes.BACnetObjectId;
    // Object that has changed
    objId: BACnetTypes.BACnetObjectId;
    // Remaining lifetime of the subscription in seconds. 00 - indefinite lifetime
    timeRemaining: BACnetTypes.BACnetUnsignedInteger;
    // List of one or more `notification` property values
    listOfValues: BACnetTypes.BACnetTypeBase[];
}

/*
 * Complex ACK APDU Layer
 */
export interface ILayerComplexACK {
    type: BACnetServiceTypes;
    seg: boolean;
    mor: boolean;
    invokeId: number;
    sequenceNumber: number;
    proposedWindowSize: number;
    serviceChoice: BACnetConfirmedService;
    service: ILayerComplexACKService;
}

export type ILayerComplexACKService = ILayerComplexACKServiceReadProperty;

export interface ILayerComplexACKServiceReadProperty {
    objId: BACnetTypes.BACnetObjectId;
    prop: IBACnetPropertyValue;
}

/*
 * Simple ACK APDU Layer
 */
export interface ILayerSimpleACK {
    type: BACnetServiceTypes;
    invokeId: number;
    serviceChoice: BACnetConfirmedService;
    service: ILayerSimpleACKService;
}

export type ILayerSimpleACKService = ILayerSimpleACKServiceSubscribeCOV
    | ILayerSimpleACKServiceWriteProperty;

export interface ILayerSimpleACKServiceSubscribeCOV {
}
export interface ILayerSimpleACKServiceWriteProperty {
}
