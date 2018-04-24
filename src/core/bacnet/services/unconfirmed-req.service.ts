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
    private readonly className: string = 'UnconfirmedReq';

    /**
     * whoIs - sends the "whoIs" request.
     *
     * @param  {IServiceUnconfirmReqWhoIs} opts - request options
     * @param  {OutputSocket} outputSoc - output socket
     * @return {type}
     */
    public whoIs (opts: IServiceUnconfirmedReqWhoIs) {
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
     * @param  {IServiceUnconfirmReqIAm} opts - request options
     * @param  {OutputSocket} outputSoc - output socket
     * @return {type}
     */
    public iAm (opts: IServiceUnconfirmedReqIAm) {
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
     * @param  {RequestSocket} req - request object (socket)
     * @param  {ResponseSocket} resp - response object (socket)
     * @return {type}
     */
    public covNotification (opts: IServiceUnconfirmedReqCOVNotification) {
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

export const unconfirmedReqService: UnconfirmedReqService = new UnconfirmedReqService();
