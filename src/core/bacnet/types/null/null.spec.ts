import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { BACnetNull } from './null.type';

import { BACnetReaderUtil, BACnetWriterUtil } from '../../utils';

describe('BACnetNull', () => {
    describe('readValue', () => {
        let bacnetNull: BACnetNull;
        let bacnetReaderUtil: BACnetReaderUtil;

        beforeEach(() => {
            bacnetNull = new BACnetNull();
        });

        it('should read correct tag', () => {
            bacnetReaderUtil = new BACnetReaderUtil(Buffer.from([0x11]));
            bacnetNull.readValue(bacnetReaderUtil);

            const tag = bacnetNull.getTag();
            expect(tag).to.deep.equal({ num: 1, type: 0, value: 1 });
        });

        it('should read "null" value', () => {
            bacnetReaderUtil = new BACnetReaderUtil(Buffer.from([0x11]));
            bacnetNull.readValue(bacnetReaderUtil);

            const value = bacnetNull.getValue();
            expect(value).to.equal(null);
        });
    });

    describe('writeValue', () => {
        let bacnetNull: BACnetNull;
        let bacnetWriterUtil: BACnetWriterUtil;

        beforeEach(() => {
            bacnetWriterUtil = new BACnetWriterUtil();
        });

        it('should write correct buffer for "null" value', () => {
            bacnetNull = new BACnetNull();
            bacnetNull.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([0x00]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });
    });
});
