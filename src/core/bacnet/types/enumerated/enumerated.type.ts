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

    /**
     * readValue - parses the message with BACnet "enumerated" value.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "enumerated" BACnet value
     * @param  {type} [changeOffset = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReaderUtil, changeOffset: boolean = true): void {
        const tag = reader.readTag(changeOffset);
        this.tag = tag;

        const value: number = reader.readUInt8(changeOffset)
        this.data = value;
    }

    /**
     * writeValue - writes the BACnet "enumerated" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriterUtil): void {
        writer.writeTag(BACnetPropTypes.enumerated, 0, 1);

        // Write status flags
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
