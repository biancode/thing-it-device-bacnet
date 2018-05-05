import * as _ from 'lodash';

import { BACnetError } from '../../errors';

import { TyperUtil, BACnetReaderUtil } from '../../utils';

import { BACnetReader, BACnetWriter } from '../../io';

import {
    BACnetPropTypes,
    BACnetTagTypes,
    BACnetConfirmedService,
    BACnetServiceTypes,
} from '../../enums';

import {
    IBACnetPropertyValue,
    ILayerComplexACK,
    ILayerComplexACKService,
    ILayerComplexACKServiceReadProperty,
} from '../../interfaces';

import {
    IWriteComplexACK,
    IWriteComplexACKReadProperty,
} from '../../interfaces';

import * as BACnetTypes from '../../types';

export class ComplexACKPDU {
    public readonly className: string = 'ComplexACKPDU';

    /**
     * getFromBuffer - parses the "APDU Complex ACK" message.
     *
     * @param  {Buffer} buf - js Buffer with "APDU Complex ACK" message
     * @return {ILayerComplexACK}
     */
    private getFromBuffer (buf: Buffer): ILayerComplexACK {
        const reader = new BACnetReader(buf);

        let reqMap: ILayerComplexACK;
        let serviceChoice: BACnetConfirmedService, serviceData: ILayerComplexACKService;
        let pduType: number, pduSeg: boolean, pduMor: boolean;
        let invokeId: number, sequenceNumber: number, proposedWindowSize: number;

        try {
            // --- Read meta byte
            const mMeta = reader.readUInt8();

            pduType = TyperUtil.getBitRange(mMeta, 4, 4);

            pduSeg = !!TyperUtil.getBit(mMeta, 3);

            pduMor = !!TyperUtil.getBit(mMeta, 2);

            // --- Read InvokeID byte
            invokeId = reader.readUInt8();

            if (pduSeg) {
                sequenceNumber = reader.readUInt8();

                proposedWindowSize = reader.readUInt8();
            }

            serviceChoice = reader.readUInt8();

            switch (serviceChoice) {
                case BACnetConfirmedService.ReadProperty:
                    serviceData = this.getReadProperty(reader);
                    break;
            }
        } catch (error) {
            throw new BACnetError(`${this.className} - getFromBuffer: Parse - ${error}`);
        }

        reqMap = {
            type: pduType,
            seg: pduSeg,
            mor: pduMor,
            invokeId: invokeId,
            sequenceNumber: sequenceNumber,
            proposedWindowSize: proposedWindowSize,
            serviceChoice: serviceChoice,
            service: serviceData,
        };

        return reqMap;
    }

    /**
     * getReadProperty - parses the "APDU Complex ACK Read Property" message.
     *
     * @param  {BACnetReader} reader - BACnet reader with "APDU Complex ACK Read Property" message
     * @return {ILayerComplexACKServiceReadProperty}
     */
    private getReadProperty (reader: BACnetReader): ILayerComplexACKServiceReadProperty {
        let serviceData: ILayerComplexACKServiceReadProperty;

        let objId: BACnetTypes.BACnetObjectId;
        let prop: IBACnetPropertyValue;

        try {
            objId = BACnetTypes.BACnetObjectId.readParam(reader);

            prop = BACnetReaderUtil.readProperty(reader);
        } catch (error) {
            throw new BACnetError(`${this.className} - getReadProperty: Parse - ${error}`);
        }

        serviceData = {
            objId: objId,
            prop: prop,
        };

        return serviceData;
    }

    /**
     * writeReq - writes the "APDU Complex ACK" header.
     *
     * @param  {IWriteComplexACK} params - "APDU Complex ACK" write params
     * @return {BACnetWriter}
     */
    public writeReq (params: IWriteComplexACK): BACnetWriter {
        const writer = new BACnetWriter();

        // Write service meta
        // Set service type
        let mMeta = TyperUtil.setBitRange(0x00,
            BACnetServiceTypes.ComplexACKPDU, 4, 4);

        // Set service SEG flag
        if (!_.isNil(params.seg)) {
            mMeta = TyperUtil.setBit(mMeta, 3, params.seg);
        }

        // Set service MOR flag
        if (!_.isNil(params.mor)) {
            mMeta = TyperUtil.setBit(mMeta, 2, params.mor);
        }

        writer.writeUInt8(mMeta);

        // Write InvokeID
        writer.writeUInt8(params.invokeId);

        return writer;
    }

    /**
     * writeReq - writes the "APDU Complex ACK Read Property" message.
     *
     * @param  {IWriteComplexACKReadProperty} params - "APDU Complex ACK Read Property" write params
     * @return {BACnetWriter}
     */
    public writeReadProperty (params: IWriteComplexACKReadProperty): BACnetWriter {
        const writer = new BACnetWriter();

        // Write Service choice
        writer.writeUInt8(BACnetConfirmedService.ReadProperty);

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
        writer.writeValue(params.unitProp.payload, { num: 3, type: BACnetTagTypes.context });

        return writer;
    }
}

export const complexACKPDU: ComplexACKPDU = new ComplexACKPDU();
