import * as _ from 'lodash';

import { BACnetTypeBase } from '../type.base';

import {
    BACnetPropTypes,
} from '../../enums';

import {
    IBACnetTag,
} from '../../interfaces';

import { BACnetError } from '../../errors';

import { BACnetReaderUtil, BACnetWriterUtil } from '../../utils';

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

    /**
     * readValue - parses the message with BACnet "unsigned integer" value.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "unsigned integer" BACnet value
     * @param  {type} [changeOffset = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReaderUtil, changeOffset: boolean = true): void {
        const tag = reader.readTag(changeOffset);
        this.tag = tag;

        let value: number;
        switch (tag.value) {
            case 1:
                value = reader.readUInt8(changeOffset);
                break;
            case 2:
                value = reader.readUInt16BE(changeOffset);
                break;
            case 4:
                value = reader.readUInt32BE(changeOffset);
                break;
        }

        this.data = value;
    }

    /**
     * writeValue - writes the BACnet "unsigned integer" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriterUtil): void {
        writer.writeParam(this.data, BACnetPropTypes.unsignedInt, 0);
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
