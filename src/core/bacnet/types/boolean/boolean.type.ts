import * as _ from 'lodash';

import { BACnetTypeBase } from '../type.base';

import {
    BACnetPropTypes,
    BACnetTagTypes,
} from '../../enums';

import {
    IBACnetTag,
} from '../../interfaces';

import { BACnetError } from '../../errors';

import { BACnetReaderUtil, BACnetWriterUtil } from '../../utils';

export class BACnetBoolean extends BACnetTypeBase {
    public readonly className: string = 'BACnetBoolean';
    public readonly type: BACnetPropTypes = BACnetPropTypes.boolean;

    protected tag: IBACnetTag;
    protected data: boolean;

    constructor (defValue?: boolean) {
        super();

        this.data = _.isUndefined(defValue)
            ? false : this.checkAndGetValue(defValue);
    }

    static readParam (reader: BACnetReaderUtil, changeOffset?: boolean): BACnetBoolean {
        return super.readParam(reader, changeOffset);
    }

    /**
     * readValue - parses the message with BACnet "boolean" value.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "boolean" BACnet value
     * @param  {type} [changeOffset = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReaderUtil, changeOffset: boolean = true): void {
        const tag = reader.readTag(changeOffset);
        this.tag = tag;

        this.data = !!tag.value;
    }

    /**
     * writeValue - writes the BACnet "boolean" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriterUtil): void {
        writer.writeTag(BACnetPropTypes.boolean, BACnetTagTypes.application, +this.data);
    }

    /**
     * writeParam - writes the BACnet Param as "boolean" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @param  {IBACnetTag} tag - BACnet tag
     * @return {void}
     */
    public writeParam (writer: BACnetWriterUtil, tag: IBACnetTag): void {
        const dataSize: number = 1;
        // Tag Number - Tag Type - Param Length (bytes)
        writer.writeTag(tag.num, tag.type, dataSize);
        // Write "boolean" value
        writer.writeUIntValue(+this.data);
    }

    /**
     * setValue - sets the new BACnet "boolean" value as internal state.
     *
     * @param  {boolean} newValue - new "boolean" value
     * @return {void}
     */
    public setValue (newValue: boolean): void {
        this.data = this.checkAndGetValue(newValue);
    }

    /**
     * getValue - returns the internal state as current BACnet "boolean" value.
     *
     * @return {boolean}
     */
    public getValue (): boolean {
        return this.data;
    }

    /**
     * value - sets the new BACnet "boolean" value as internal state
     *
     * @type {boolean}
     */
    public set value (newValue: boolean) {
        this.setValue(newValue);
    }

    /**
     * value - returns the internal state as current BACnet "boolean" value.
     *
     * @type {boolean}
     */
    public get value (): boolean {
        return this.getValue();
    }

    /**
     * checkAndGetValue - checks if "value" is a correct "boolean" value, throws
     * the error if "value" has incorrect type.
     *
     * @param  {boolean} value - "boolean" value
     * @return {boolean}
     */
    private checkAndGetValue (value: boolean): boolean {
        if (!_.isBoolean(value)) {
            throw new BACnetError('BACnetBoolean - updateValue: Value must be of type "boolean"!');
        }

        return value;
    }
}
