import * as _ from 'lodash';

import { blvc, npdu, apdu } from '../layers';

import { ILayer, ILayerBLVC } from '../interfaces';

import * as BACnetTypes from '../types';

export class BACnetUtil {

    static bufferToLayer (buf: Buffer): ILayer {
        let blvcMessage: ILayerBLVC = blvc.getFromBuffer(buf);
        return {
            blvc: blvcMessage,
            npdu: _.get(blvcMessage, 'npdu'),
            apdu: _.get(blvcMessage, 'npdu.apdu'),
        };
    }
}
