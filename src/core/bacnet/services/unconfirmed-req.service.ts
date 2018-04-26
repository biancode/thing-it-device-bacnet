import {
    BLVCFunction,
} from '../enums';

import { unconfirmedReqPDU } from '../layers/apdus';
import { blvc, npdu } from '../layers';

import { BACnetWriterUtil } from '../utils';

import {
    IServiceUnconfirmedReqCOVNotification,
    IServiceUnconfirmedReqWhoIs,
    IServiceUnconfirmedReqIAm,
} from '../interfaces';

export class UnconfirmedReqService {
    static readonly className: string = 'UnconfirmedReq';

    /**
     * whoIs - sends the "whoIs" request.
     *
     * @static
     * @param  {IServiceUnconfirmReqWhoIs} opts - request options
     * @param  {OutputSocket} outputSoc - output socket
     * @return {type}
     */
    static whoIs (opts: IServiceUnconfirmedReqWhoIs) {
        // Generate APDU writer
        const writerUnconfirmReq = unconfirmedReqPDU.writeReq(opts);
        const writerWhoIs = unconfirmedReqPDU.writeWhoIs(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerUnconfirmReq, writerWhoIs);

        // Generate NPDU writer
        const writerNPDU = npdu.writeNPDULayer({
            control: {
                destSpecifier: true,
            },
            destNetworkAddress: 0xffff,
            hopCount: 0xff,
        });

        // Generate BLVC writer
        const writerBLVC = blvc.writeBLVCLayer({
            func: BLVCFunction.originalBroadcastNPDU,
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
     * iAm - sends the "iAm" unconfirmed request.
     *
     * @static
     * @param  {IServiceUnconfirmReqIAm} opts - request options
     * @param  {OutputSocket} outputSoc - output socket
     * @return {type}
     */
    static iAm (opts: IServiceUnconfirmedReqIAm) {
        // Generate APDU writer
        const writerUnconfirmReq = unconfirmedReqPDU.writeReq(opts);
        const writerIAm = unconfirmedReqPDU.writeIAm(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerUnconfirmReq, writerIAm);

        // Generate NPDU writer
        const writerNPDU = npdu.writeNPDULayer({
            control: {
                destSpecifier: true,
            },
            destNetworkAddress: 0xffff,
            hopCount: 0xff,
        });

        // Generate BLVC writer
        const writerBLVC = blvc.writeBLVCLayer({
            func: BLVCFunction.originalBroadcastNPDU,
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
     * covNotification - sends the "COV notification" unconfirmed request.
     *
     * @static
     * @param  {RequestSocket} req - request object (socket)
     * @param  {ResponseSocket} resp - response object (socket)
     * @return {type}
     */
    static covNotification (opts: IServiceUnconfirmedReqCOVNotification) {
        // Generate APDU writer
        const writerUnconfirmReq = unconfirmedReqPDU.writeReq(opts);
        const writerCOVNotification = unconfirmedReqPDU.writeCOVNotification(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerUnconfirmReq, writerCOVNotification);

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
