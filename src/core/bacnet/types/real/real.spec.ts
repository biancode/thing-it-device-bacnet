import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { BACnetReal } from './real.type';

import { BACnetReader, BACnetWriter } from '../../io';

describe('BACnetReal', () => {
    describe('readValue', () => {
        let bacnetReal: BACnetReal;
        let bacnetReaderUtil: BACnetReader;

        beforeEach(() => {
            bacnetReal = new BACnetReal();
        });

        it('should read correct tag', () => {
            bacnetReaderUtil = new BACnetReader(Buffer.from([
                0x44, 0x41, 0xb4, 0x00, 0x00,
            ]));
            bacnetReal.readValue(bacnetReaderUtil);

            const tag = bacnetReal.getTag();
            expect(tag).to.deep.equal({ num: 4, type: 0, value: 4 });
        });

        it('should read "22.5" value', () => {
            bacnetReaderUtil = new BACnetReader(Buffer.from([
                0x44, 0x41, 0xb4, 0x00, 0x00,
            ]));
            bacnetReal.readValue(bacnetReaderUtil);

            const value = bacnetReal.getValue();
            expect(value).to.equal(22.5);
        });

        it('should read "25.2" value', () => {
            bacnetReaderUtil = new BACnetReader(Buffer.from([
                0x44, 0x41, 0xc9, 0x99, 0x9a,
            ]));
            bacnetReal.readValue(bacnetReaderUtil);

            const value = bacnetReal.getValue();
            expect(value).to.equal(25.2);
        });
    });

    describe('writeValue', () => {
        let bacnetReal: BACnetReal;
        let bacnetWriterUtil: BACnetWriter;

        beforeEach(() => {
            bacnetWriterUtil = new BACnetWriter();
        });

        it('should write correct buffer for "22.5" value', () => {
            bacnetReal = new BACnetReal(22.5);
            bacnetReal.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0x44, 0x41, 0xb4, 0x00, 0x00 ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });

        it('should write correct buffer for "25.2" value', () => {
            bacnetReal = new BACnetReal(25.2);
            bacnetReal.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0x44, 0x41, 0xc9, 0x99, 0x9a ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });
    });
});
