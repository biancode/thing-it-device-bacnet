import * as _ from 'lodash';

import { BACnetTypeBase } from '../type.base';

import {
    BACnetPropTypes,
    BACnetTagTypes,
} from '../../enums';

import {
    IBACnetTag,
    IBACnetReaderOptions,
} from '../../interfaces';

import { BACnetError } from '../../errors';

import { BACnetReader, BACnetWriter } from '../../io';

export class BACnetEnumerated extends BACnetTypeBase {
    public readonly className: string = 'BACnetEnumerated';
    public readonly type: BACnetPropTypes = BACnetPropTypes.enumerated;

    protected tag: IBACnetTag;
    protected data: number;

    constructor (defValue?: number) {
        super();

        this.data = _.isUndefined(defValue)
            ? 0 : this.checkAndGetValue(defValue);
    }

    static readParam (reader: BACnetReader, opts?: IBACnetReaderOptions): BACnetEnumerated {
        return super.readParam(reader, opts);
    }

    /**
     * readValue - parses the message with BACnet "enumerated" value.
     *
     * @param  {BACnetReader} reader - BACnet reader with "enumerated" BACnet value
     * @param  {type} [opts = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReader, opts?: IBACnetReaderOptions): void {
        const tag = reader.readTag(opts);
        this.tag = tag;

        const value: number = reader.readUInt8(opts)
        this.data = value;
    }

    /**
     * writeValue - writes the BACnet "enumerated" value.
     *
     * @param  {BACnetWriter} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriter): void {
        this.writeParam(writer, {
            num: BACnetPropTypes.enumerated,
            type: BACnetTagTypes.application,
        });
    }

    /**
     * writeParam - writes the BACnet Param as "enumerated" value.
     *
     * @param  {BACnetWriter} writer - BACnet writer
     * @param  {IBACnetTag} tag - BACnet tag
     * @return {void}
     */
    public writeParam (writer: BACnetWriter, tag: IBACnetTag): void {
        const dataSize: number = 1;
        // Tag Number - Tag Type - Param Length (bytes)
        writer.writeTag(tag.num, tag.type, dataSize);
        // Write "enumerated" value
        writer.writeUInt8(this.data);
    }

    /**
     * setValue - sets the new BACnet "enumerated" value as internal state.
     *
     * @param  {number} newValue - new "enumerated" value
     * @return {void}
     */
    public setValue (newValue: number): void {
        this.data = this.checkAndGetValue(newValue);
    }

    /**
     * getValue - returns the internal state as current BACnet "enumerated" value.
     *
     * @return {number}
     */
    public getValue (): number {
        return this.data;
    }

    /**
     * value - sets the new BACnet "enumerated" value as internal state
     *
     * @type {number}
     */
    public set value (newValue: number) {
        this.setValue(newValue);
    }

    /**
     * value - returns the internal state as current BACnet "enumerated" value.
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
     * @param  {number|BACnetEnumerated} data - data for comparison
     * @return {boolean} - result of the comparison
     */
    public isEqual (data: number|BACnetEnumerated): boolean {
        if (_.isNil(data)) {
            return false;
        }

        if (typeof data === `number`) {
            return this.value === data;
        }

        if (data instanceof BACnetEnumerated) {
            return this.value === data.value;
        }

        return false;
    }

    /**
     * checkAndGetValue - checks if "value" is a correct "enumerated" value, throws
     * the error if "value" has incorrect type.
     *
     * @param  {number} value - "enumerated" value
     * @return {number}
     */
    private checkAndGetValue (value: number): number {
        if (!_.isNumber(value) || !_.isFinite(value)) {
            throw new BACnetError('BACnetEnumerated - updateValue: Value must be of type "enumerated"!');
        }

        return value;
    }
}
