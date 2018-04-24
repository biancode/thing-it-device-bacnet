import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { BACnetUnsignedInteger } from './unsigned-integer.type';

import { BACnetReaderUtil, BACnetWriterUtil } from '../../utils';

describe('BACnetUnsignedInteger', () => {
    describe('readValue', () => {
        let bacnetUnsignedInteger: BACnetUnsignedInteger;
        let bacnetReaderUtil: BACnetReaderUtil;

        beforeEach(() => {
            bacnetUnsignedInteger = new BACnetUnsignedInteger();
        });

        it('should read correct tag', () => {
            bacnetReaderUtil = new BACnetReaderUtil(Buffer.from([
                0x21, 0x23,
            ]));
            bacnetUnsignedInteger.readValue(bacnetReaderUtil);

            const tag = bacnetUnsignedInteger.getTag();
            expect(tag).to.deep.equal({ num: 2, type: 0, value: 1 });
        });

        it('should read "0x23" value', () => {
            bacnetReaderUtil = new BACnetReaderUtil(Buffer.from([
                0x21, 0x23,
            ]));
            bacnetUnsignedInteger.readValue(bacnetReaderUtil);

            const value = bacnetUnsignedInteger.getValue();
            expect(value).to.equal(0x23);
        });

        it('should read "0x1211" value', () => {
            bacnetReaderUtil = new BACnetReaderUtil(Buffer.from([
                0x22, 0x12, 0x11,
            ]));
            bacnetUnsignedInteger.readValue(bacnetReaderUtil);

            const value = bacnetUnsignedInteger.getValue();
            expect(value).to.equal(0x1211);
        });
    });

    describe('writeValue', () => {
        let bacnetUnsignedInteger: BACnetUnsignedInteger;
        let bacnetWriterUtil: BACnetWriterUtil;

        beforeEach(() => {
            bacnetWriterUtil = new BACnetWriterUtil();
        });

        it('should write correct buffer for "0x23" value', () => {
            bacnetUnsignedInteger = new BACnetUnsignedInteger(0x23);
            bacnetUnsignedInteger.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0x21, 0x23 ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });

        it('should write correct buffer for "0x1211" value', () => {
            bacnetUnsignedInteger = new BACnetUnsignedInteger(0x1211);
            bacnetUnsignedInteger.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0x22, 0x12, 0x11 ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });
    });
});
