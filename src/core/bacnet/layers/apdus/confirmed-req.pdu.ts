import * as _ from 'lodash';

import { BACnetError } from '../../errors';

import {
    OffsetUtil,
    TyperUtil,
    BACnetReaderUtil,
    BACnetWriterUtil,
} from '../../utils';

import {
    ILayerConfirmedReq,
    ILayerConfirmedReqService,
    ILayerConfirmedReqServiceReadProperty,
    ILayerConfirmedReqServiceSubscribeCOV,
    ILayerConfirmedReqServiceWriteProperty,
} from '../../interfaces';

import {
    IWriteConfirmedReq,
    IWriteConfirmedReqReadProperty,
    IWriteConfirmedReqWriteProperty,
    IWriteConfirmedReqSubscribeCoVProperty,
    IWriteConfirmedReqUnsubscribeCoVProperty,
} from '../../interfaces';

import {
    BACnetPropTypes,
    BACnetTagTypes,
    BACnetConfirmedService,
    BACnetServiceTypes,
} from '../../enums';

import {
    BACnetUnsignedInteger,
    BACnetObjectId,
    BACnetTypeBase,
} from '../../types';

import * as BACnetTypes from '../../types';

export class ConfirmedReqPDU {
    public readonly className: string = 'ConfirmedReqPDU';

    /**
     * getFromBuffer - parses the "APDU Confirmed Request" message.
     *
     * @param  {Buffer} buf - js Buffer with "APDU Confirmed Request" message
     * @return {ILayerConfirmedReq}
     */
    public getFromBuffer (buf: Buffer): ILayerConfirmedReq {
        const reader = new BACnetReaderUtil(buf);

        let reqMap: ILayerConfirmedReq;
        let serviceChoice: BACnetConfirmedService, serviceData: ILayerConfirmedReqService;
        let pduType: number, pduSeg: boolean, pduMor: boolean, pduSa: boolean;
        let invokeId: number, sequenceNumber: number, proposedWindowSize: number;
        let maxResp: number, maxSegs: number;

        try {
            // --- Read meta byte
            const mMeta = reader.readUInt8();

            pduType = TyperUtil.getBitRange(mMeta, 4, 4);

            pduSeg = !!TyperUtil.getBit(mMeta, 3);

            pduMor = !!TyperUtil.getBit(mMeta, 2);

            pduSa = !!TyperUtil.getBit(mMeta, 1);

            // --- Read control byte
            const mControl = reader.readUInt8();

            maxSegs = TyperUtil.getBitRange(mControl, 4, 3);

            maxResp = TyperUtil.getBitRange(mControl, 0, 4);

            // --- Read InvokeID byte
            invokeId = reader.readUInt8();

            if (pduSeg) {
                sequenceNumber = reader.readUInt8();

                proposedWindowSize = reader.readUInt8();
            }

            serviceChoice = reader.readUInt8();

            switch (serviceChoice) {
                case BACnetConfirmedService.SubscribeCOV:
                    serviceData = this.getSubscribeCOV(reader);
                    break;
                case BACnetConfirmedService.ReadProperty:
                    serviceData = this.getReadProperty(reader);
                    break;
                case BACnetConfirmedService.WriteProperty:
                    serviceData = this.getWriteProperty(reader);
                    break;
            }
        } catch (error) {
            throw new BACnetError(`${this.className} - getFromBuffer: Parse - ${error}`);
        }

        reqMap = {
            type: pduType,
            seg: pduSeg,
            mor: pduMor,
            sa: pduSa,
            maxSegs: maxSegs,
            maxResp: maxResp,
            invokeId: invokeId,
            serviceChoice: serviceChoice,
            service: serviceData,
        };

        return reqMap;
    }

    /**
     * getReadProperty - parses the "APDU Confirmed Request Read Property" message.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "APDU Confirmed Request Read Property" message
     * @return {ILayerConfirmedReqServiceReadProperty}
     */
    private getReadProperty (reader: BACnetReaderUtil): ILayerConfirmedReqServiceReadProperty {
        let serviceData: ILayerConfirmedReqServiceReadProperty;
        let objId: BACnetObjectId, propId: BACnetUnsignedInteger;

        try {
            objId = reader.readObjectIdentifier();

            propId = reader.readParam();
        } catch (error) {
            throw new BACnetError(`${this.className} - getReadProperty: Parse - ${error}`);
        }

        serviceData = {
            objId: objId,
            propId: propId,
        };

        return serviceData;
    }

    /**
     * getSubscribeCOV - parses the "APDU Confirmed Request Subscribe CoV" message.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "APDU Confirmed Request Subscribe CoV" message
     * @return {ILayerConfirmedReqServiceSubscribeCOV}
     */
    private getSubscribeCOV (reader: BACnetReaderUtil): ILayerConfirmedReqServiceSubscribeCOV {
        let serviceData: ILayerConfirmedReqServiceSubscribeCOV;
        let objId: BACnetObjectId,
            subscriberProcessId: BACnetUnsignedInteger,
            issConfNotif: BACnetUnsignedInteger,
            lifeTime: BACnetUnsignedInteger;

        try {
            subscriberProcessId = reader.readParam();

            objId = reader.readObjectIdentifier();

            issConfNotif = reader.readParam();

            lifeTime = reader.readParam();
        } catch (error) {
            throw new BACnetError(`${this.className} - getSubscribeCOV: Parse - ${error}`);
        }

        serviceData = {
            objId: objId,
            subscriberProcessId: subscriberProcessId,
            issConfNotif: issConfNotif,
            lifeTime: lifeTime,
        };

        return serviceData;
    }

    /**
     * getWriteProperty - parses the "APDU Confirmed Request Write Property" message.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "APDU Confirmed Request Write Property" message
     * @return {ILayerConfirmedReqServiceWriteProperty}
     */
    private getWriteProperty (reader: BACnetReaderUtil): ILayerConfirmedReqServiceWriteProperty {
        let serviceData: ILayerConfirmedReqServiceWriteProperty;
        let objId: BACnetObjectId,
            propId: BACnetUnsignedInteger,
            propValues: BACnetTypeBase[],
            priority: BACnetUnsignedInteger;

        try {
            objId = reader.readObjectIdentifier();

            propId = reader.readParam();

            propValues = reader.readParamValue();

            priority = reader.readParam();
        } catch (error) {
            throw new BACnetError(`${this.className} - getWriteProperty: Parse - ${error}`);
        }

        serviceData = {
            objId: objId,
            propId: propId,
            propValues: propValues,
            priority: priority,
        };

        return serviceData;
    }

    /**
     * writeReq - writes the "APDU Confirmed Request" header.
     *
     * @param  {IWriteConfirmedReq} params - "APDU Confirmed Request" write params
     * @return {BACnetWriterUtil}
     */
    public writeReq (params: IWriteConfirmedReq): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service Type
        let mMeta = TyperUtil.setBitRange(0x00,
            BACnetServiceTypes.ConfirmedReqPDU, 4, 4);
        mMeta = TyperUtil.setBit(mMeta, 1, params.segAccepted || false);
        writer.writeUInt8(mMeta);

        // Write max response size
        writer.writeUInt8(0x05);

        // Write InvokeID
        writer.writeUInt8(params.invokeId);

        return writer;
    }

    /**
     * writeReadProperty - writes the "APDU Confirmed Request Read Property" message.
     *
     * @param  {IWriteConfirmedReqReadProperty} params - "APDU Confirmed Request Read Property" write params
     * @return {BACnetWriterUtil}
     */
    public writeReadProperty (params: IWriteConfirmedReqReadProperty): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service choice
        writer.writeUInt8(BACnetConfirmedService.ReadProperty);

        // Write Object identifier
        params.unitObjId.writeParam(writer, { num: 0, type: BACnetTagTypes.context });

        // Write Property ID
        const unitPropId = new BACnetTypes.BACnetEnumerated(params.propId);
        unitPropId.writeParam(writer, { num: 1, type: BACnetTagTypes.context });

        if (_.isNumber(params.propArrayIndex)) {
            // Write Property Array Index
            const unitPropIndex = new BACnetTypes.BACnetUnsignedInteger(params.propArrayIndex);
            unitPropIndex.writeParam(writer, { num: 2, type: BACnetTagTypes.context });
        }

        return writer;
    }

    /**
     * writeWriteProperty - writes the "APDU Confirmed Request Write Property" message.
     *
     * @param  {IWriteConfirmedReqWriteProperty} params - "APDU Confirmed Request Write Property" write params
     * @return {BACnetWriterUtil}
     */
    public writeWriteProperty (params: IWriteConfirmedReqWriteProperty): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service choice
        writer.writeUInt8(BACnetConfirmedService.WriteProperty);

        // Write Object identifier
        params.unitObjId.writeParam(writer, { num: 0, type: BACnetTagTypes.context });

        // Write Property ID
        const unitPropId = new BACnetTypes.BACnetEnumerated(params.unitProp.id);
        unitPropId.writeParam(writer, { num: 1, type: BACnetTagTypes.context });

        if (_.isNumber(params.unitProp.index)) {
            // Write Property Array Index
            const unitPropIndex = new BACnetTypes.BACnetUnsignedInteger(params.unitProp.index);
            unitPropIndex.writeParam(writer, { num: 2, type: BACnetTagTypes.context });
        }

        // Write Property Value
        const propValue = params.unitProp.payload as BACnetTypes.BACnetTypeBase;
        propValue.writeParam(writer, { num: 3, type: BACnetTagTypes.context });

        if (params.unitProp.commandable) {
            // Write Property Priority
            const unitPropPriority = new BACnetTypes.BACnetUnsignedInteger(params.unitProp.priority);
            unitPropPriority.writeParam(writer, { num: 4, type: BACnetTagTypes.context });
        }

        return writer;
    }

    /**
     * writeSubscribeCoV - writes the "APDU Confirmed Request Subscribe CoV" message
     * to subscribe or re-subscribe to the CoV events.
     *
     * @param  {IWriteConfirmedReqSubscribeCoVProperty} params - "APDU Confirmed Request Subscribe CoV" write params
     * @return {BACnetWriterUtil}
     */
    public writeSubscribeCoV (params: IWriteConfirmedReqSubscribeCoVProperty): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service choice
        writer.writeUInt8(BACnetConfirmedService.SubscribeCOV);

        // Write Subscriber Process Identifier
        params.processId.writeParam(writer, { num: 0, type: BACnetTagTypes.context });

        // Monitored Object Identifier
        params.unitObjId.writeParam(writer, { num: 1, type: BACnetTagTypes.context });

        if (_.isNil(params.issConfNotif)) {
            return writer;
        }

        // Issue Confirmed Notifications
        params.issConfNotif.writeParam(writer, { num: 2, type: BACnetTagTypes.context });

        if (_.isNil(params.lifetime)) {
            return writer;
        }

        // Issue Confirmed Notifications
        params.lifetime.writeParam(writer, { num: 3, type: BACnetTagTypes.context });

        return writer;
    }

    /**
     * writeUnsubscribeCoV - writes the "APDU Confirmed Request Subscribe CoV" message
     * to cancel the CoV subscription.
     *
     * @param  {IWriteConfirmedReqUnsubscribeCoVProperty} params - "APDU Confirmed Request Subscribe CoV" write params
     * @return {BACnetWriterUtil}
     */
    public writeUnsubscribeCoV (params: IWriteConfirmedReqUnsubscribeCoVProperty): BACnetWriterUtil {
        return this.writeSubscribeCoV(params as IWriteConfirmedReqSubscribeCoVProperty);
    }
}

export const confirmedReqPDU: ConfirmedReqPDU = new ConfirmedReqPDU();
