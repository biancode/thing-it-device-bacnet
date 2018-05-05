import * as _ from 'lodash';

import { BACnetError } from '../../errors';

import { TyperUtil } from '../../utils';

import { BACnetReader, BACnetWriter } from '../../io';

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

import * as BACnetTypes from '../../types';

export class SimpleACKPDU {
    public readonly className: string = 'SimpleACKPDU';

    /**
     * getFromBuffer - parses the "APDU Simple ACK" message.
     *
     * @param  {Buffer} buf - js Buffer with "APDU Simple ACK" message
     * @return {ILayerSimpleACK}
     */
    public getFromBuffer (buf: Buffer): ILayerSimpleACK {
        const reader = new BACnetReader(buf);

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
     * @param  {BACnetReader} reader - BACnet reader with "APDU Simple ACK Subscribe CoV" message
     * @return {ILayerSimpleACKServiceSubscribeCOV}
     */
    private getSubscribeCOV (reader: BACnetReader): ILayerSimpleACKServiceSubscribeCOV {
        const serviceMap: ILayerSimpleACKServiceSubscribeCOV = {};

        return serviceMap;
    }

    /**
     * getSubscribeCOV - parses the "APDU Simple ACK Write Property" message.
     *
     * @param  {BACnetReader} reader - BACnet reader with "APDU Simple ACK Subscribe CoV" message
     * @return {ILayerSimpleACKServiceWriteProperty}
     */
    private getWriteProperty (reader: BACnetReader): ILayerSimpleACKServiceWriteProperty {
        const serviceMap: ILayerSimpleACKServiceWriteProperty = {};

        return serviceMap;
    }

    /**
     * writeReq - writes the "APDU Simple ACK" header.
     *
     * @param  {IWriteSimpleACK} params - "APDU Simple ACK" write params
     * @return {BACnetWriter}
     */
    public writeReq (params: IWriteSimpleACK): BACnetWriter {
        const writer = new BACnetWriter();

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
     * @return {BACnetWriter}
     */
    public writeSubscribeCOV (params: IWriteSimpleACKSubscribeCOV): BACnetWriter {
        const writer = new BACnetWriter();

        // Write Service choice
        writer.writeUInt8(BACnetConfirmedService.SubscribeCOV);

        return writer;
    }

    /**
     * writeWriteProperty - writes the "APDU Simple ACK Write Property" message.
     *
     * @param  {IWriteSimpleACKWriteProperty} params - "APDU Simple ACK Write Property" write params
     * @return {BACnetWriter}
     */
    public writeWriteProperty (params: IWriteSimpleACKWriteProperty): BACnetWriter {
        const writer = new BACnetWriter();

        // Write Service choice
        writer.writeUInt8(BACnetConfirmedService.WriteProperty);

        return writer;
    }
}

export const simpleACKPDU: SimpleACKPDU = new SimpleACKPDU();
