import {
    IBACnetObjectProperty,
} from './bacnet.interface';

import {
    BLVCFunction,
} from '../enums';

import { BACnetWriterUtil } from '../utils';

import * as BACnetTypes from '../types';

export interface IWriteBLVC {
    func: BLVCFunction;
    npdu: BACnetWriterUtil;
    apdu: BACnetWriterUtil;
}

export interface IWriteNPDU {
    control?: IWriteNPDUControl;
    destNetworkAddress?: number;
    destMacAddress?: string;
    srcNetworkAddress?: number;
    srcMacAddress?: string;
    hopCount?: number;
}

export interface IWriteNPDUControl {
    noApduMessageType?: boolean;
    destSpecifier?: boolean;
    srcSpecifier?: boolean;
    expectingReply?: boolean;
    priority1?: number;
    priority2?: number;
}

/**
 * Unconfirmed Request
 */
export interface IWriteUnconfirmedReq {
}
export interface IWriteUnconfirmedReqWhoIs {
}
export interface IWriteUnconfirmedReqIAm {
    objId: IBACnetObjectProperty;
    vendorId: IBACnetObjectProperty;
}
export interface IWriteUnconfirmedReqCOVNotification {
    processId: BACnetTypes.BACnetUnsignedInteger;
    devObjId: BACnetTypes.BACnetObjectId;
    unitObjId: BACnetTypes.BACnetObjectId;
    reportedProps: IBACnetObjectProperty[];
}

export interface IServiceUnconfirmedReqCOVNotification
    extends IWriteUnconfirmedReq, IWriteUnconfirmedReqCOVNotification {
}
export interface IServiceUnconfirmedReqWhoIs
    extends IWriteUnconfirmedReq, IWriteUnconfirmedReqWhoIs {
}
export interface IServiceUnconfirmedReqIAm
    extends IWriteUnconfirmedReq, IWriteUnconfirmedReqIAm {
}


/**
 * Confirmed Request
 */
export interface IWriteConfirmedReq {
    segAccepted?: boolean;
    invokeId: number;
}
export interface IWriteConfirmedReqReadProperty {
    unitObjId: BACnetTypes.BACnetObjectId;
    propId: number;
    propArrayIndex?: number;
}
export interface IWriteConfirmedReqWriteProperty {
    unitObjId: BACnetTypes.BACnetObjectId;
    unitProp: IBACnetObjectProperty;
}

export interface IServiceConfirmedReqReadProperty
    extends IWriteConfirmedReq, IWriteConfirmedReqReadProperty {
}


/**
 * Simple ACK
 */
export interface IWriteSimpleACK {
    invokeId: number;
}
export interface IWriteSimpleACKSubscribeCOV {
}
export interface IWriteSimpleACKWriteProperty {
}

export interface IServiceSimpleACKSubscribeCOV
    extends IWriteSimpleACK, IWriteSimpleACKSubscribeCOV {
}
export interface IServiceSimpleACKWriteProperty
    extends IWriteSimpleACK, IWriteSimpleACKWriteProperty {
}


/**
 * Complex ACK
 */
export interface IWriteComplexACK {
    seg?: boolean;
    mor?: boolean;
    invokeId: number;
}
export interface IWriteComplexACKReadProperty {
    unitObjId: BACnetTypes.BACnetObjectId;
    unitProp: IBACnetObjectProperty;
}

export interface IServiceComplexACKReadProperty
    extends IWriteComplexACK, IWriteComplexACKReadProperty {
}
