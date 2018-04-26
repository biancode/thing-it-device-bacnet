import * as _ from 'lodash';

import { BACnetError } from '../../errors';

import {
    OffsetUtil,
    TyperUtil,
    BACnetReaderUtil,
    BACnetWriterUtil,
} from '../../utils';

import {
    ILayerUnconfirmedReq,
    ILayerUnconfirmedReqService,
    ILayerUnconfirmedReqServiceIAm,
    ILayerUnconfirmedReqServiceWhoIs,
} from '../../interfaces';

import {
    IWriteUnconfirmedReq,
    IWriteUnconfirmedReqIAm,
    IWriteUnconfirmedReqCOVNotification,
    IWriteUnconfirmedReqWhoIs,
} from '../../interfaces';

import {
    BACnetPropTypes,
    BACnetPropertyId,
    BACnetTagTypes,
    BACnetUnconfirmedService,
    BACnetServiceTypes,
} from '../../enums';

import * as BACnetTypes from '../../types';

export class UnconfirmedReqPDU {
    public readonly className: string = 'UnconfirmedReqPDU';

    /**
     * getFromBuffer - parses the "APDU Unconfirmed Request" message.
     *
     * @param  {Buffer} buf - js Buffer with "APDU Unconfirmed Request" message
     * @return {ILayerUnconfirmedReq}
     */
    public getFromBuffer (buf: Buffer): ILayerUnconfirmedReq {
        const reader = new BACnetReaderUtil(buf);

        let reqMap: ILayerUnconfirmedReq;
        let serviceChoice: BACnetUnconfirmedService, serviceData: ILayerUnconfirmedReqService;
        let pduType: number;

        try {
            // --- Read meta byte
            const mMeta = reader.readUInt8();

            pduType = TyperUtil.getBitRange(mMeta, 4, 4);

            serviceChoice = reader.readUInt8();

            switch (serviceChoice) {
                case BACnetUnconfirmedService.iAm:
                    serviceData = this.getIAm(reader);
                    break;
                case BACnetUnconfirmedService.whoIs:
                    serviceData = this.getWhoIs(reader);
                    break;
            }
        } catch (error) {
            throw new BACnetError(`${this.className} - getFromBuffer: Parse - ${error}`);
        }

        reqMap = {
            type: pduType,
            serviceChoice: serviceChoice,
            service: serviceData,
        };

        return reqMap;
    }

    /**
     * getIAm - parses the "APDU Unconfirmed Request I Am" message.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "APDU Unconfirmed Request I Am" message
     * @return {ILayerUnconfirmedReqServiceIAm}
     */
    private getIAm (reader: BACnetReaderUtil): ILayerUnconfirmedReqServiceIAm {
        let serviceData: ILayerUnconfirmedReqServiceIAm;
        let objId: BACnetTypes.BACnetObjectId,
            maxAPDUlength: BACnetTypes.BACnetUnsignedInteger,
            segmSupported: BACnetTypes.BACnetEnumerated,
            vendorId: BACnetTypes.BACnetUnsignedInteger;

        try {
            objId = BACnetTypes.BACnetObjectId.readParam(reader);

            maxAPDUlength = BACnetTypes.BACnetUnsignedInteger.readParam(reader);

            segmSupported = BACnetTypes.BACnetEnumerated.readParam(reader);

            vendorId = BACnetTypes.BACnetUnsignedInteger.readParam(reader);
        } catch (error) {
            throw new BACnetError(`${this.className} - getIAm: Parse - ${error}`);
        }

        serviceData = {
            objId: objId,
            maxAPDUlength: maxAPDUlength,
            segmSupported: segmSupported,
            vendorId: vendorId,
        };

        return serviceData;
    }

    /**
     * getWhoIs - parses the "APDU Unconfirmed Request Who Is" message.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "APDU Unconfirmed Request Who Is" message
     * @return {ILayerUnconfirmedReqServiceWhoIs}
     */
    private getWhoIs (reader: BACnetReaderUtil): ILayerUnconfirmedReqServiceWhoIs {
        const serviceData: ILayerUnconfirmedReqServiceWhoIs = {};

        return serviceData;
    }

    /**
     * writeReq - writes the "APDU Unconfirmed Request" header.
     *
     * @param  {IWriteUnconfirmedReq} params - "APDU Unconfirmed Request" write params
     * @return {BACnetWriterUtil}
     */
    public writeReq (params: IWriteUnconfirmedReq): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service Type
        const mMeta = TyperUtil.setBitRange(0x00,
            BACnetServiceTypes.UnconfirmedReqPDU, 4, 4);
        writer.writeUInt8(mMeta);

        return writer;
    }

    /**
     * writeWhoIs - writes the "APDU Unconfirmed Request Who Is" message.
     *
     * @param  {IWriteUnconfirmedReqWhoIs} params - "APDU Unconfirmed Request Who Is" write params
     * @return {BACnetWriterUtil}
     */
    public writeWhoIs (params: IWriteUnconfirmedReqWhoIs): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service choice
        writer.writeUInt8(BACnetUnconfirmedService.whoIs);

        return writer;
    }

    /**
     * writeIAm - writes the "APDU Unconfirmed Request I Am" message.
     *
     * @param  {IWriteUnconfirmedReqIAm} params - "APDU Unconfirmed Request I Am" write params
     * @return {BACnetWriterUtil}
     */
    public writeIAm (params: IWriteUnconfirmedReqIAm): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service choice
        writer.writeUInt8(BACnetUnconfirmedService.iAm);

        // Write Object identifier
        params.objId.writeValue(writer);

        // Write maxAPDUlength (1476 chars)
        const maxAPDUlength = new BACnetTypes.BACnetUnsignedInteger(0x05c4);
        maxAPDUlength.writeValue(writer);

        // Write Segmentation supported
        const segmSupported = new BACnetTypes.BACnetEnumerated(0x00);
        segmSupported.writeValue(writer);

        // Write Vendor ID
        params.vendorId.writeValue(writer);

        return writer;
    }

    /**
     * writeCOVNotification - writes the "APDU Unconfirmed Request CoV Notification" message.
     *
     * @param  {IWriteUnconfirmedReqCOVNotification} params - "APDU Unconfirmed Request CoV Notification" write params
     * @return {BACnetWriterUtil}
     */
    public writeCOVNotification (params: IWriteUnconfirmedReqCOVNotification): BACnetWriterUtil {
        const writer = new BACnetWriterUtil();

        // Write Service choice
        writer.writeUInt8(BACnetUnconfirmedService.covNotification);

        // Write Process Identifier
        params.processId.writeParam(writer, { num: 0, type: BACnetTagTypes.context });

        // Write Object Identifier for master Object
        params.devObjId.writeParam(writer, { num: 1, type: BACnetTagTypes.context });

        // Write Object Identifier for slave Object
        params.unitObjId.writeParam(writer, { num: 2, type: BACnetTagTypes.context });

        // Write timer remaining
        const timeRemaining = new BACnetTypes.BACnetUnsignedInteger(0x00);
        timeRemaining.writeParam(writer, { num: 3, type: BACnetTagTypes.context });

        // List of Values
        // Write opening tag for list of values
        writer.writeTag(4, BACnetTagTypes.context, 6);

        _.map(params.reportedProps, (reportedProp) => {
            // Write Property ID
            const propId = new BACnetTypes.BACnetEnumerated(reportedProp.id);
            propId.writeParam(writer, { num: 0, type: BACnetTagTypes.context });
            // Write Property Value
            writer.writeValue(reportedProp.payload, { num: 2, type: BACnetTagTypes.context });
        });

        // Write closing tag for list of values
        writer.writeTag(4, BACnetTagTypes.context, 7);

        return writer;
    }
}

export const unconfirmedReqPDU: UnconfirmedReqPDU = new UnconfirmedReqPDU();
