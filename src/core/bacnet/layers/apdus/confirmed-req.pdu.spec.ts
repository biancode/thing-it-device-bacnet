// Import all chai for type matching with "chai-as-promised" lib
import * as chai from 'chai';

import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { confirmedReqPDU } from './confirmed-req.pdu';

import {
    ILayerConfirmedReqServiceReadProperty,
} from '../../interfaces';

describe('ConfirmedReqPDU', () => {
    describe('getFromBuffer', () => {
        let buf: Buffer;

        beforeEach(() => {
            buf = Buffer.from([0x00, 0x05, 0x01, 0x0c, 0x0c,
                0x02, 0x00, 0x27, 0x0f, 0x19, 0x4d]);
        });

        it('should return Map with correct metadata', () => {
            const newBuf = confirmedReqPDU.getFromBuffer(buf);
            expect(newBuf.type).to.equal(0x00);
            expect(newBuf.seg).to.equal(false);
            expect(newBuf.mor).to.equal(false);
            expect(newBuf.sa).to.equal(false);
            expect(newBuf.maxSegs).to.equal(0x00);
            expect(newBuf.maxResp).to.equal(0x05);
            expect(newBuf.invokeId).to.equal(0x01);
            expect(newBuf.serviceChoice).to.equal(0x0c);
            const service = newBuf.service as ILayerConfirmedReqServiceReadProperty;

            const objId = service.objId;
            const objTag = objId.getTag();
            expect(objTag.num).to.equal(0);
            expect(objTag.type).to.equal(1);
            expect(objTag.value).to.equal(4);
            const objIdPayload = objId.getValue();
            expect(objIdPayload.type).to.equal(8);
            expect(objIdPayload.instance).to.equal(9999);

            const propId = service.propId;
            const propTag = propId.getTag();
            expect(propTag.num).to.equal(1);
            expect(propTag.type).to.equal(1);
            expect(propTag.value).to.equal(1);
            const propIdPayload = propId.getValue();
            expect(propIdPayload).to.equal(77);
        });
    });
});
