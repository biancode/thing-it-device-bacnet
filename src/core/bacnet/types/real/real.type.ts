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

export class BACnetReal extends BACnetTypeBase {
    public readonly className: string = 'BACnetReal';
    public readonly type: BACnetPropTypes = BACnetPropTypes.real;

    protected tag: IBACnetTag;
    protected data: number;

    constructor (defValue?: number) {
        super();

        this.data = _.isUndefined(defValue)
            ? 0 : this.checkAndGetValue(defValue);
    }

    static readParam (reader: BACnetReader, opts?: IBACnetReaderOptions): BACnetReal {
        return super.readParam(reader, opts);
    }

    /**
     * readValue - parses the message with BACnet "real" value.
     *
     * @param  {BACnetReader} reader - BACnet reader with "real" BACnet value
     * @param  {type} [opts = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReader, opts?: IBACnetReaderOptions): void {
        const tag = reader.readTag(opts);
        this.tag = tag;

        let value: number = reader.readFloatBE(opts);
        this.data = this.toFixed(value);
    }

    /**
     * writeValue - writes the BACnet "real" value.
     *
     * @param  {BACnetWriter} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriter): void {
        this.writeParam(writer, {
            num: BACnetPropTypes.real,
            type: BACnetTagTypes.application,
        });
    }

    /**
     * writeParam - writes the BACnet Param as "real" value.
     *
     * @param  {BACnetWriter} writer - BACnet writer
     * @param  {IBACnetTag} tag - BACnet tag
     * @return {void}
     */
    public writeParam (writer: BACnetWriter, tag: IBACnetTag): void {
        const dataSize: number = 4;
        // Tag Number - Tag Type - Param Length (bytes)
        writer.writeTag(tag.num, tag.type, dataSize);
        // Write "real" value
        writer.writeFloatBE(this.data)
    }

    /**
     * setValue - sets the new BACnet "real" value as internal state.
     *
     * @param  {number} newValue - new "real" value
     * @return {void}
     */
    public setValue (newValue: number): void {
        this.data = this.checkAndGetValue(newValue);
    }

    /**
     * getValue - returns the internal state as current BACnet "real" value.
     *
     * @return {number}
     */
    public getValue (): number {
        return this.data;
    }

    /**
     * value - sets the new BACnet "real" value as internal state
     *
     * @type {number}
     */
    public set value (newValue: number) {
        this.setValue(newValue);
    }

    /**
     * value - returns the internal state as current BACnet "real" value.
     *
     * @type {number}
     */
    public get value (): number {
        return this.getValue();
    }

    /**
     * checkAndGetValue - checks if "value" is a correct "real" value, throws
     * the error if "value" has incorrect type.
     *
     * @param  {number} value - "real" value
     * @return {number}
     */
    private checkAndGetValue (value: number): number {
        if (!_.isNumber(value) || !_.isFinite(value)) {
            throw new BACnetError('BACnetReal - updateValue: Value must be of type "real"!');
        }

        return this.toFixed(value);
    }

    /**
     * HELPERs
     */

    private toFixed (value: number): number {
        return +value.toFixed(4);
    }
}
