import * as _ from 'lodash';

import { BACnetError } from '../errors';

import {
    OffsetUtil,
    TyperUtil,
    BACnetReaderUtil,
} from '../utils';

import {
    ConfirmedReqPDU,
    SimpleACKPDU,
    UnconfirmedReqPDU,
    ComplexACKPDU,
} from './apdus';

import { BACnetServiceTypes } from '../enums';

import {
    ILayerAPDU,
} from '../interfaces';

export class APDU {
    public readonly className: string = 'APDU';

    /**
     * getFromBuffer - parses the "APDU" message.
     *
     * @param  {Buffer} buf - js Buffer with "APDU" message
     * @return {ILayerAPDU}
     */
    public getFromBuffer (buf: Buffer): ILayerAPDU {
        const reader = new BACnetReaderUtil(buf);

        let APDUMessage: ILayerAPDU;
        try {
            const mType = reader.readUInt8();
            const pduType = (mType >> 4) & 0x0F

            let reqInst;
            switch (pduType) {
                case BACnetServiceTypes.ConfirmedReqPDU: {
                    reqInst = new ConfirmedReqPDU();
                    break;
                }
                case BACnetServiceTypes.UnconfirmedReqPDU: {
                    reqInst = new UnconfirmedReqPDU();
                    break;
                }
                case BACnetServiceTypes.SimpleACKPDU: {
                    reqInst = new SimpleACKPDU();
                    break;
                }
                case BACnetServiceTypes.ComplexACKPDU: {
                    reqInst = new ComplexACKPDU();
                    break;
                }
            }

            APDUMessage = reqInst.getFromBuffer(buf);
        } catch (error) {
            throw new BACnetError(`${this.className} - getFromBuffer: Parse - ${error}`);
        }

        return APDUMessage;
    }
}

export const apdu: APDU = new APDU();
