import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { BACnetObjectId } from './object-id.type';

import { BACnetReader, BACnetWriter } from '../../io';

describe('BACnetObjectId', () => {
    describe('readValue', () => {
        let bacnetObjectId: BACnetObjectId;
        let bacnetReaderUtil: BACnetReader;

        beforeEach(() => {
            bacnetObjectId = new BACnetObjectId();
            bacnetReaderUtil = new BACnetReader(Buffer.from([
                0xc4, 0x02, 0x00, 0x27, 0x0f,
            ]));
            bacnetObjectId.readValue(bacnetReaderUtil);
        });

        it('should read correct tag', () => {
            const tag = bacnetObjectId.getTag();
            expect(tag).to.deep.equal({ num: 12, type: 0, value: 4 });
        });

        it('should read "type: 8, instance: 9999" value', () => {
            const value = bacnetObjectId.getValue();
            expect(value).to.deep.equal({ type: 8, instance: 9999 });
        });
    });

    describe('writeValue', () => {
        let bacnetObjectId: BACnetObjectId;
        let bacnetWriterUtil: BACnetWriter;

        beforeEach(() => {
            bacnetWriterUtil = new BACnetWriter();
        });

        it('should write correct buffer for "type: 8, instance: 9999" value', () => {
            bacnetObjectId = new BACnetObjectId({ type: 8, instance: 9999 });
            bacnetObjectId.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0xc4, 0x02, 0x00, 0x27, 0x0f, ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });

        it('should write correct buffer for "type: 5, instance: 46" value', () => {
            bacnetObjectId = new BACnetObjectId({ type: 5, instance: 46 });
            bacnetObjectId.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0xc4, 0x01, 0x40, 0x00, 0x2e ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });
    });
});
