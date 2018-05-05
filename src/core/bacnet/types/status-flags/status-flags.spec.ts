import { expect } from 'chai';
import { spy, SinonSpy } from 'sinon';

import { BACnetStatusFlags } from './status-flags.type';

import { BACnetReader, BACnetWriter } from '../../io';

describe('BACnetStatusFlags', () => {
    describe('readValue', () => {
        let bacnetStatusFlags: BACnetStatusFlags;
        let bacnetReaderUtil: BACnetReader;

        beforeEach(() => {
            bacnetStatusFlags = new BACnetStatusFlags();
            bacnetReaderUtil = new BACnetReader(Buffer.from([
                0x82, 0x04, 0x90,
            ]));
            bacnetStatusFlags.readValue(bacnetReaderUtil);
        });

        it('should read correct tag', () => {
            const tag = bacnetStatusFlags.getTag();
            expect(tag).to.deep.equal({ num: 8, type: 0, value: 2 });
        });

        it('should read "inAlarm: true, fault: false, overridden: false, outOfService: true," value', () => {
            const value = bacnetStatusFlags.getValue();
            expect(value).to.deep.equal({
                inAlarm: true,
                fault: false,
                overridden: false,
                outOfService: true
            });
        });
    });

    describe('writeValue', () => {
        let bacnetStatusFlags: BACnetStatusFlags;
        let bacnetWriterUtil: BACnetWriter;

        beforeEach(() => {
            bacnetWriterUtil = new BACnetWriter();
        });

        it('should write correct buffer for "inAlarm: true, fault: false, overridden: false, outOfService: true" value', () => {
            bacnetStatusFlags = new BACnetStatusFlags({
                inAlarm: true,
                fault: false,
                overridden: false,
                outOfService: true,
            });
            bacnetStatusFlags.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0x82, 0x04, 0x90 ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });

        it('should write correct buffer for "inAlarm: true, fault: true, overridden: true, outOfService: false" value', () => {
            bacnetStatusFlags = new BACnetStatusFlags({
                inAlarm: true,
                fault: true,
                overridden: true,
                outOfService: false,
            });
            bacnetStatusFlags.writeValue(bacnetWriterUtil);

            const writerBuffer = bacnetWriterUtil.getBuffer();
            const proposedBuffer = Buffer.from([ 0x82, 0x04, 0xe0 ]);
            expect(writerBuffer).to.deep.equal(proposedBuffer);
        });
    });
});
