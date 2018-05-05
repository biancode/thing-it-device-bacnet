import * as _ from 'lodash';

import { BACnetTypeBase } from '../type.base';

import {
    BACnetPropTypes,
} from '../../enums';

import {
    IBACnetTag,
    IBACnetTypeStatusFlags,
    IBACnetReaderOptions,
} from '../../interfaces';

import { BACnetError } from '../../errors';

import {
    TyperUtil,
} from '../../utils';

import { BACnetReader, BACnetWriter } from '../../io';

export class BACnetStatusFlags extends BACnetTypeBase {
    public readonly className: string = 'BACnetBitString';
    public readonly type: BACnetPropTypes = BACnetPropTypes.bitString;

    protected tag: IBACnetTag;
    protected data: IBACnetTypeStatusFlags;

    constructor (defValue?: IBACnetTypeStatusFlags) {
        super();

        this.data = this.checkAndGetValue(defValue);
    }

    static readParam (reader: BACnetReader, opts?: IBACnetReaderOptions): BACnetStatusFlags {
        return super.readParam(reader, opts);
    }

    /**
     * readValue - parses the message with BACnet "status flags" value.
     *
     * @param  {BACnetReader} reader - BACnet reader with "status flags" BACnet value
     * @param  {type} [opts = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReader, opts?: IBACnetReaderOptions) {
        const tag = reader.readTag(opts);
        this.tag = tag;

        const unusedBits = reader.readUInt8(opts);
        // Contains the status bits
        const value = reader.readUInt8(opts);

        const inAlarm = !!TyperUtil.getBit(value, 7);
        const fault = !!TyperUtil.getBit(value, 6);
        const overridden = !!TyperUtil.getBit(value, 5);
        const outOfService = !!TyperUtil.getBit(value, 4);

        this.data = {
            inAlarm: inAlarm,
            fault: fault,
            overridden: overridden,
            outOfService: outOfService,
        };
    }

    /**
     * writeValue - writes the BACnet "status flags" value.
     *
     * @param  {BACnetWriter} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriter) {
        writer.writeTag(BACnetPropTypes.bitString, 0, 2);

        // Write unused bits
        writer.writeUInt8(0x04);

        let statusFlags = 0x00;
        statusFlags = TyperUtil.setBit(statusFlags, 7, this.data.inAlarm);
        statusFlags = TyperUtil.setBit(statusFlags, 6, this.data.fault);
        statusFlags = TyperUtil.setBit(statusFlags, 5, this.data.overridden);
        statusFlags = TyperUtil.setBit(statusFlags, 4, this.data.outOfService);

        // Write status flags
        writer.writeUInt8(statusFlags);
    }

    /**
     * setValue - sets the new BACnet "status flags" value as internal state.
     *
     * @param  {IBACnetTypeStatusFlags} newValue - new "status flags" value
     * @return {void}
     */
    public setValue (newValue: IBACnetTypeStatusFlags): void {
        this.data = this.checkAndGetValue(newValue);
    }

    /**
     * getValue - returns the internal state as current BACnet "status flags" value.
     *
     * @return {IBACnetTypeStatusFlags}
     */
    public getValue (): IBACnetTypeStatusFlags {
        return _.cloneDeep(this.data);
    }

    /**
     * value - sets the new BACnet "status flags" value as internal state
     *
     * @type {IBACnetTypeStatusFlags}
     */
    public set value (newValue: IBACnetTypeStatusFlags) {
        this.setValue(newValue);
    }

    /**
     * value - returns the internal state as current BACnet "status flags" value.
     *
     * @type {IBACnetTypeStatusFlags}
     */
    public get value (): IBACnetTypeStatusFlags {
        return this.getValue();
    }

    /**
     * checkAndGetValue - checks if "value" is a correct "status flags" value,
     * throws the error if "value" has incorrect type.
     *
     * @param  {IBACnetTypeStatusFlags} value - "status flags" value
     * @return {IBACnetTypeStatusFlags}
     */
    private checkAndGetValue (value: IBACnetTypeStatusFlags): IBACnetTypeStatusFlags {
        return _.assign({}, {
            fault: false,
            inAlarm: false,
            outOfService: false,
            overridden: false,
        }, value);
    }
}
