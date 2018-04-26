import {
    BLVCFunction,
} from '../enums';

import { confirmedReqPDU } from '../layers/apdus';
import { blvc, npdu } from '../layers';

import { BACnetWriterUtil } from '../utils';

import {
    IServiceConfirmedReqReadProperty,
    IServiceConfirmedReqWriteProperty,
    IServiceConfirmedReqSubscribeCOV,
    IServiceConfirmedReqUnsubscribeCOV,
} from '../interfaces';

export class ConfirmedReqService {
    static readonly className: string = 'ConfirmedReq';

    /**
     * readProperty - sends the "readProperty" confirmed request.
     *
     * @static
     * @param  {IServiceConfirmedReqReadProperty} opts - request options
     * @return {Buffer}
     */
    static readProperty (opts: IServiceConfirmedReqReadProperty): Buffer {
        // Generate APDU writer
        const writerConfirmedReq = confirmedReqPDU.writeReq(opts);
        const writerReadProperty = confirmedReqPDU.writeReadProperty(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerConfirmedReq, writerReadProperty);

        // Generate NPDU writer
        const writerNPDU = npdu.writeNPDULayer({});

        // Generate BLVC writer
        const writerBLVC = blvc.writeBLVCLayer({
            func: BLVCFunction.originalUnicastNPDU,
            npdu: writerNPDU,
            apdu: writerAPDU,
        });

        // Concat messages
        const writerBACnet = BACnetWriterUtil.concat(writerBLVC, writerNPDU, writerAPDU);

        // Get and send BACnet message
        const msgBACnet = writerBACnet.getBuffer();
        return msgBACnet;
    }

    /**
     * readProperty - sends the "writeProperty" confirmed request.
     *
     * @static
     * @param  {IServiceConfirmedReqWriteProperty} opts - request options
     * @return {Buffer}
     */
    static writeProperty (opts: IServiceConfirmedReqWriteProperty): Buffer {
        // Generate APDU writer
        const writerConfirmedReq = confirmedReqPDU.writeReq(opts);
        const writerWriteProperty = confirmedReqPDU.writeWriteProperty(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerConfirmedReq, writerWriteProperty);

        // Generate NPDU writer
        const writerNPDU = npdu.writeNPDULayer({});

        // Generate BLVC writer
        const writerBLVC = blvc.writeBLVCLayer({
            func: BLVCFunction.originalUnicastNPDU,
            npdu: writerNPDU,
            apdu: writerAPDU,
        });

        // Concat messages
        const writerBACnet = BACnetWriterUtil.concat(writerBLVC, writerNPDU, writerAPDU);

        // Get and send BACnet message
        const msgBACnet = writerBACnet.getBuffer();
        return msgBACnet;
    }

    /**
     * readProperty - sends the "subscribeCOV" confirmed request.
     *
     * @static
     * @param  {IServiceConfirmedReqSubscribeCOV} opts - request options
     * @return {Buffer}
     */
    static subscribeCOV (opts: IServiceConfirmedReqSubscribeCOV): Buffer {
        // Generate APDU writer
        const writerConfirmedReq = confirmedReqPDU.writeReq(opts);
        const writerSubscribeCOV = confirmedReqPDU.writeSubscribeCOV(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerConfirmedReq, writerSubscribeCOV);

        // Generate NPDU writer
        const writerNPDU = npdu.writeNPDULayer({});

        // Generate BLVC writer
        const writerBLVC = blvc.writeBLVCLayer({
            func: BLVCFunction.originalUnicastNPDU,
            npdu: writerNPDU,
            apdu: writerAPDU,
        });

        // Concat messages
        const writerBACnet = BACnetWriterUtil.concat(writerBLVC, writerNPDU, writerAPDU);

        // Get and send BACnet message
        const msgBACnet = writerBACnet.getBuffer();
        return msgBACnet;
    }

    /**
     * unsubscribeCOV - sends the "unsubscribeCOV" confirmed request.
     *
     * @static
     * @param  {IServiceConfirmedReqUnsubscribeCOV} opts - request options
     * @return {Buffer}
     */
    static unsubscribeCOV (opts: IServiceConfirmedReqUnsubscribeCOV): Buffer {
        // Generate APDU writer
        const writerConfirmedReq = confirmedReqPDU.writeReq(opts);
        const writerUnsubscribeCOV = confirmedReqPDU.writeUnsubscribeCOV(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerConfirmedReq, writerUnsubscribeCOV);

        // Generate NPDU writer
        const writerNPDU = npdu.writeNPDULayer({});

        // Generate BLVC writer
        const writerBLVC = blvc.writeBLVCLayer({
            func: BLVCFunction.originalUnicastNPDU,
            npdu: writerNPDU,
            apdu: writerAPDU,
        });

        // Concat messages
        const writerBACnet = BACnetWriterUtil.concat(writerBLVC, writerNPDU, writerAPDU);

        // Get and send BACnet message
        const msgBACnet = writerBACnet.getBuffer();
        return msgBACnet;
    }
}
