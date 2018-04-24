import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { BACnetCharacterString } from './character-string.type';

import { BACnetReaderUtil, BACnetWriterUtil } from '../../utils';

describe('BACnetCharacterString', () => {
    describe('readValue', () => {
        let bacnetCharacterString: BACnetCharacterString;
        let bacnetReaderUtil: BACnetReaderUtil;

        beforeEach(() => {
            bacnetCharacterString = new BACnetCharacterString();
            bacnetReaderUtil = new BACnetReaderUtil(Buffer.from([
                0x75, 0x04, 0x00, 0x4c, 0x30, 0x32,
            ]));
            bacnetCharacterString.readValue(bacnetReaderUtil);
        });

        it('should read correct tag', () => {
            const tag = bacnetCharacterString.getTag();
            expect(tag).to.deep.equal({ num: 7, type: 0, value: 5 });
        });

        it('should read "L02" value', () => {
            const value = bacnetCharacterString.getValue();
            expect(value).to.equal('L02');
        });
    });

    describe('writeValue', () => {
        let bacnetCharacterString: BACnetCharacterString;
        let bacnetWriterUtil: BACnetWriterUtil;

        beforeEach(() => {
            bacnetWriterUtil = new BACnetWriterUtil();
        });

        it('should write correct buffer for "L02" value', () => {
            bacnetCharacterString = new BACnetCharacterString('L02');
            bacnetCharacterString.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0x75, 0x04, 0x00, 0x4c, 0x30, 0x32, ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });

        it('should write correct buffer for "L202" value', () => {
            bacnetCharacterString = new BACnetCharacterString('L202');
            bacnetCharacterString.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0x75, 0x05, 0x00, 0x4c, 0x32, 0x30, 0x32 ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });
    });
});
