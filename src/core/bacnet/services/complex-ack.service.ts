import {
    BLVCFunction,
} from '../enums';

import { complexACKPDU } from '../layers/apdus';
import { blvc, npdu } from '../layers';

import { BACnetWriterUtil } from '../utils';

import {
    IServiceComplexACKReadProperty,
} from '../interfaces';

export class ComplexACKService {
    private readonly className: string = 'ComplexACK';

    /**
     * readProperty - sends the "readProperty" complex ack request.
     *
     * @param  {IServiceComplexACKReadProperty} opts - request options
     * @param  {OutputSocket} outputSoc - output socket
     * @return {type}
     */
    public readProperty (opts: IServiceComplexACKReadProperty): Buffer {
        // Generate APDU writer
        const writerComplexACK = complexACKPDU.writeReq(opts);
        const writerReadProperty = complexACKPDU.writeReadProperty(opts);
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

export const complexACKService: ComplexACKService = new ComplexACKService();
