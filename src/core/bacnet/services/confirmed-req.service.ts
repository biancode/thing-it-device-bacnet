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

    /**
     * readProperty - sends the "readProperty" confirmed request.
     *
     * @param  {IServiceConfirmedReqReadProperty} opts - request options
     * @return {Buffer}
     */
    public readProperty (opts: IServiceConfirmedReqReadProperty): Buffer {
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
     * @param  {IServiceConfirmedReqWriteProperty} opts - request options
     * @return {Buffer}
     */
    public writeProperty (opts: IServiceConfirmedReqWriteProperty): Buffer {
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
     * @param  {IServiceConfirmedReqSubscribeCOV} opts - request options
     * @return {Buffer}
     */
    public subscribeCOV (opts: IServiceConfirmedReqSubscribeCOV): Buffer {
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
     * @param  {IServiceConfirmedReqUnsubscribeCOV} opts - request options
     * @return {Buffer}
     */
    public unsubscribeCOV (opts: IServiceConfirmedReqUnsubscribeCOV): Buffer {
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

export const confirmedReqService: ConfirmedReqService = new ConfirmedReqService();
