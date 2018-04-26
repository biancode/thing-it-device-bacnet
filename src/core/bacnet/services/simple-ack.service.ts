import {
    BLVCFunction,
} from '../enums';

import { complexACKPDU, simpleACKPDU } from '../layers/apdus';
import { blvc, npdu } from '../layers';

import { BACnetWriterUtil } from '../utils';

import {
    IServiceSimpleACKSubscribeCOV,
    IServiceSimpleACKWriteProperty,
} from '../interfaces';

export class SimpleACKService {
    static readonly className: string = 'SimpleACK';

    /**
     * subscribeCOV - sends the "subscribeCOV" simple ack request.
     *
     * @static
     * @param  {IServiceSimpleACKSubscribeCOV} opts - request options
     * @param  {OutputSocket} outputSoc - output socket
     * @return {type}
     */
    static subscribeCOV (opts: IServiceSimpleACKSubscribeCOV) {
        // Generate APDU writer
        const writerSimpleACKPDU = simpleACKPDU.writeReq(opts);
        const writerSubscribeCOV = simpleACKPDU.writeSubscribeCOV(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerSimpleACKPDU, writerSubscribeCOV);

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
     * writeProperty - sends the "writeProperty" simple ack request.
     *
     * @static
     * @param  {IServiceSimpleACKWriteProperty} opts - request options
     * @param  {OutputSocket} outputSoc - output socket
     * @return {type}
     */
    static writeProperty (
            opts: IServiceSimpleACKWriteProperty) {
        // Generate APDU writer
        const writerSimpleACKPDU = simpleACKPDU.writeReq(opts);
        const writerSubscribeCOV = simpleACKPDU.writeWriteProperty(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerSimpleACKPDU, writerSubscribeCOV);

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
