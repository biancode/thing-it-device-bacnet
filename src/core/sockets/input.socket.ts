import * as dgram from 'dgram';

import * as Bluebird from 'bluebird';

import { blvc } from '../bacnet/layers';

import { logger } from '../utils';

import { ILayerBLVC, ILayerNPDU, ILayerAPDU } from '../bacnet/interfaces';

export class InputSocket {
    public readonly className: string = 'InputSocket';
    public blvc: ILayerBLVC;
    public npdu: ILayerNPDU;
    public apdu: ILayerAPDU;

    constructor (msg: Buffer) {
        logger.debug(`${this.className} - message: ${msg.toString('hex')}`);

        try {
            this.blvc = blvc.getFromBuffer(msg);
        } catch (error) {
            logger.error(error);
        }

        try {
            this.npdu = this.blvc.npdu;
        } catch (error) {
            this.npdu = null;
        }

        try {
            this.apdu = this.npdu.apdu;
        } catch (error) {
            this.apdu = null;
        }
    }
}
