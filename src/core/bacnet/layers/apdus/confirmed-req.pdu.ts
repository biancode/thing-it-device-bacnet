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
        writer.writeTag(0, BACnetTagTypes.context, 4);
        writer.writeObjectIdentifier(params.unitObjId.getValue());

        // Write Property ID
        writer.writeParam(params.propId, 1);

        if (_.isNumber(params.propArrayIndex)) {
            // Write Property Array Index
            writer.writeParam(params.propArrayIndex, 2);
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
        writer.writeTag(0, BACnetTagTypes.context, 4);
        writer.writeObjectIdentifier(params.unitObjId.getValue());

        // Write Property ID
        writer.writeParam(params.unitProp.id, 1);

        if (_.isNumber(params.unitProp.index)) {
            // Write Property Array Index
            writer.writeParam(params.unitProp.index, 2);
        }

        // Write Property Value
        writer.writeValue(3, params.unitProp.payload);

        if (params.unitProp.commandable) {
            // Write Property Priority
            writer.writeParam(params.unitProp.priority, 4);
        }

        return writer;
    }
}

export const confirmedReqPDU: ConfirmedReqPDU = new ConfirmedReqPDU();
