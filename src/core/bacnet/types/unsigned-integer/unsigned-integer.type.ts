import * as _ from 'lodash';

import { BACnetTypeBase } from '../type.base';

import {
    BACnetPropTypes,
    BACnetTagTypes,
    OpertionMaxValue,
} from '../../enums';

import {
    IBACnetTag,
    IBACnetReaderOptions,
} from '../../interfaces';

import { BACnetError } from '../../errors';

import { BACnetReader, BACnetWriter } from '../../io';

export class BACnetUnsignedInteger extends BACnetTypeBase {
    public readonly className: string = 'BACnetUnsignedInteger';
    public readonly type: BACnetPropTypes = BACnetPropTypes.unsignedInt;

    protected tag: IBACnetTag;
    protected data: number;

    constructor (defValue?: number) {
        super();

        this.data = _.isUndefined(defValue)
            ? 0 : this.checkAndGetValue(defValue);
    }

    static readParam (reader: BACnetReader, opts?: IBACnetReaderOptions): BACnetUnsignedInteger {
        return super.readParam(reader, opts);
    }

    /**
     * readValue - parses the message with BACnet "unsigned integer" value.
     *
     * @param  {BACnetReader} reader - BACnet reader with "unsigned integer" BACnet value
     * @param  {type} [opts = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReader, opts?: IBACnetReaderOptions): void {
        const tag = reader.readTag(opts);
        this.tag = tag;

        let value: number;
        switch (tag.value) {
            case 1:
                value = reader.readUInt8(opts);
                break;
            case 2:
                value = reader.readUInt16BE(opts);
                break;
            case 4:
                value = reader.readUInt32BE(opts);
                break;
        }

        this.data = value;
    }

    /**
     * writeValue - writes the BACnet "unsigned integer" value.
     *
     * @param  {BACnetWriter} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriter): void {
        this.writeParam(writer, {
            num: BACnetPropTypes.unsignedInt,
            type: BACnetTagTypes.application,
        });
    }

    /**
     * writeParam - writes the BACnet Param as "unsigned integer" value.
     *
     * @param  {BACnetWriter} writer - BACnet writer
     * @param  {IBACnetTag} tag - BACnet tag
     * @return {void}
     */
    public writeParam (writer: BACnetWriter, tag: IBACnetTag): void {
        const dataSize = this.getUIntSize(this.data);
        // Tag Number - Tag Type - Param Length (bytes)
        writer.writeTag(tag.num, tag.type, dataSize);
        // Write "unsigned integer" value
        writer.writeUIntValue(this.data);
    }

    /**
     * setValue - sets the new BACnet "unsigned integer" value as internal state.
     *
     * @param  {number} newValue - new "unsigned integer" value
     * @return {void}
     */
    public setValue (newValue: number): void {
        this.data = newValue;
    }

    /**
     * getValue - returns the internal state as current BACnet "unsigned integer" value.
     *
     * @return {number}
     */
    public getValue (): number {
        return this.data;
    }

    /**
     * value - sets the new BACnet "unsigned integer" value as internal state
     *
     * @type {number}
     */
    public set value (newValue: number) {
        this.setValue(newValue);
    }

    /**
     * value - returns the internal state as current BACnet "unsigned integer" value.
     *
     * @type {number}
     */
    public get value (): number {
        return this.getValue();
    }

    /**
     * Performs a comparison between current BACnet value and `data` to determine if
     * they are equivalent.
     *
     * @param  {number|BACnetUnsignedInteger} data - data for comparison
     * @return {boolean} - result of the comparison
     */
    public isEqual (data: number|BACnetUnsignedInteger): boolean {
        if (_.isNil(data)) {
            return false;
        }

        if (typeof data === `number`) {
            return this.value === data;
        }

        if (data instanceof BACnetUnsignedInteger) {
            return this.value === data.value;
        }

        return false;
    }

    /**
     * HELPERs
     */

    /**
     * getUIntSize - returns the size (byte) of the unsigned int value.
     *
     * @param  {number} uIntValue - unsigned int value
     * @return {number}
     */
    public getUIntSize (uIntValue: number): number {
        if (uIntValue <= OpertionMaxValue.uInt8) {
            return 1;
        } else if (uIntValue <= OpertionMaxValue.uInt16) {
            return 2;
        } else if (uIntValue <= OpertionMaxValue.uInt32) {
            return 4;
        }
    }

    /**
     * checkAndGetValue - checks if "value" is a correct "unsigned integer" value, throws
     * the error if "value" has incorrect type.
     *
     * @param  {number} value - "unsigned integer" value
     * @return {number}
     */
    private checkAndGetValue (value: number): number {
        if (!_.isNumber(value) || !_.isFinite(value)) {
            throw new BACnetError('BACnetUnsignedInteger - updateValue: Value must be of type "unsigned integer"!');
        }

        return value;
    }
}
