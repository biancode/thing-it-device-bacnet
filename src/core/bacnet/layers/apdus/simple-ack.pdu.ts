import * as _ from 'lodash';

import { BACnetError } from '../../errors';

import {
    OffsetUtil,
    TyperUtil,
    BACnetReaderUtil,
    BACnetWriterUtil,
} from '../../utils';

import {
    ILayerSimpleACK,
    ILayerSimpleACKService,
    ILayerSimpleACKServiceSubscribeCOV,
    ILayerSimpleACKServiceWriteProperty,
} from '../../interfaces';

import {
    IWriteSimpleACK,
    IWriteSimpleACKSubscribeCOV,
    IWriteSimpleACKWriteProperty,
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

export class SimpleACKPDU {
    public readonly className: string = 'SimpleACKPDU';

    /**
     * getFromBuffer - parses the "APDU Simple ACK" message.
     *
     * @param  {Buffer} buf - js Buffer with "APDU Simple ACK" message
     * @return {ILayerSimpleACK}
     */
    public getFromBuffer (buf: Buffer): ILayerSimpleACK {
        const reader = new BACnetReaderUtil(buf);

        let reqMap: ILayerSimpleACK;
        let serviceChoice: BACnetConfirmedService, serviceData: ILayerSimpleACKService;
        let pduType: number, invokeId: number;

        try {
            // --- Read meta byte
            const mMeta = reader.readUInt8();

            pduType = TyperUtil.getBitRange(mMeta, 4, 4);

            // --- Read InvokeID byte
            invokeId = reader.readUInt8();

            serviceChoice = reader.readUInt8();

            switch (serviceChoice) {
                case BACnetConfirmedService.SubscribeCOV:
                    serviceData = this.getSubscribeCOV(reader);
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
            invokeId: invokeId,
            serviceChoice: serviceChoice,
            service: serviceData,
        };

        return reqMap;
    }

    /**
     * getSubscribeCOV - parses the "APDU Simple ACK Subscribe CoV" message.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "APDU Simple ACK Subscribe CoV" message
     * @return {ILayerSimpleACKServiceSubscribeCOV}
     */
    private getSubscribeCOV (reader: BACnetReaderUtil): ILayerSimpleACKServiceSubscribeCOV {
        const serviceMap: ILayerSimpleACKServiceSubscribeCOV = {};

        return serviceMap;
    }

    /**
     * getSubscribeCOV - parses the "APDU Simple ACK Write Property" message.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "APDU Simple ACK Subscribe CoV" message
     * @return {ILayerSimpleACKServiceWriteProperty}
     */
    private getWriteProperty (reader: BACnetReaderUtil): ILayerSimpleACKServiceWriteProperty {
        const serviceMap: ILayerSimpleACKServiceWriteProperty = {};

        return serviceMap;
    }

    /**
     * writeReq - writes the "APDU Simple ACK" header.
     *
     * @param  {IWriteSimpleACK} params - "APDU Simple ACK" write params
     * @return {BACnetWriterUtil}
     */
    public writeReq (params: IWriteSimpleACK): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service Type
        const mMeta = TyperUtil.setBitRange(0x00,
            BACnetServiceTypes.SimpleACKPDU, 4, 4);
        writer.writeUInt8(mMeta);

        // Write InvokeID
        writer.writeUInt8(params.invokeId);

        return writer;
    }

    /**
     * writeSubscribeCOV - writes the "APDU Simple ACK Subscribe CoV" message.
     *
     * @param  {IWriteSimpleACKSubscribeCOV} params - "APDU Simple ACK Subscribe CoV" write params
     * @return {BACnetWriterUtil}
     */
    public writeSubscribeCOV (params: IWriteSimpleACKSubscribeCOV): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service choice
        writer.writeUInt8(BACnetConfirmedService.SubscribeCOV);

        return writer;
    }

    /**
     * writeWriteProperty - writes the "APDU Simple ACK Write Property" message.
     *
     * @param  {IWriteSimpleACKWriteProperty} params - "APDU Simple ACK Write Property" write params
     * @return {BACnetWriterUtil}
     */
    public writeWriteProperty (params: IWriteSimpleACKWriteProperty): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service choice
        writer.writeUInt8(BACnetConfirmedService.WriteProperty);

        return writer;
    }
}

export const simpleACKPDU: SimpleACKPDU = new SimpleACKPDU();
