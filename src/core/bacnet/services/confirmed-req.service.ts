import {
    BLVCFunction,
} from '../enums';

import { confirmedReqPDU } from '../layers/apdus';
import { blvc, npdu } from '../layers';

import { BACnetWriterUtil } from '../utils';

import {
    IServiceConfirmedReqReadProperty,
} from '../interfaces';

export class ConfirmedReqService {

    /**
     * readProperty - sends the "readProperty" confirmed request.
     *
     * @param  {InputSocket} req - request object (socket)
     * @return {type}
     */
    public readProperty (opts: IServiceConfirmedReqReadProperty) {
        // Generate APDU writer
        const writerComplexACK = confirmedReqPDU.writeReq(opts);
        const writerReadProperty = confirmedReqPDU.writeReadProperty(opts);
        const writerAPDU = BACnetWriterUtil.concat(writerComplexACK, writerReadProperty);

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
