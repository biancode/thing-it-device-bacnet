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

export class BACnetCharacterString extends BACnetTypeBase {
    public readonly className: string = 'BACnetCharacterString';
    public readonly type: BACnetPropTypes = BACnetPropTypes.characterString;

    protected tag: IBACnetTag;
    private encoding: string;
    protected data: string;

    constructor (defValue?: string) {
        super();

        this.data = _.isUndefined(defValue)
            ? '' : this.checkAndGetValue(defValue);
    }

    /**
     * readValue - parses the message with BACnet "character string" value.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "character string" BACnet value
     * @param  {type} [changeOffset = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReaderUtil, changeOffset: boolean = true): void {
        const tag = reader.readTag(changeOffset);
        this.tag = tag;

        const strLen = reader.readUInt8(changeOffset);
        const charSet = reader.readUInt8(changeOffset);

        // Get the character encoding
        const charEncode = this.getStringEncode(charSet);
        this.encoding = charEncode;

        const value = reader.readString(charEncode, strLen - 1, changeOffset);
        this.data = value;
    }

    /**
     * writeValue - writes the BACnet "character string" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriterUtil): void {
        // DataType - Application tag - Extended value (5)
        writer.writeTag(BACnetPropTypes.characterString, 0, 5);

        // Write lenght
        const paramValueLen = this.data.length + 1;
        writer.writeUInt8(paramValueLen);

        // Write "ansi" / "utf8" encoding
        writer.writeUInt8(0x00);

        // Write string
        writer.writeString(this.data);
    }

    /**
     * setValue - sets the new BACnet "character string" value as internal state.
     *
     * @param  {string} newValue - new "character string" value
     * @return {void}
     */
    public setValue (newValue: string): void {
        this.data = this.checkAndGetValue(newValue);
    }

    /**
     * getValue - returns the internal state as current BACnet "character string" value.
     *
     * @return {string}
     */
    public getValue (): string {
        return this.data;
    }

    /**
     * value - sets the new BACnet "character string" value as internal state
     *
     * @type {string}
     */
    public set value (newValue: string) {
        this.setValue(newValue);
    }

    /**
     * value - returns the internal state as current BACnet "character string" value.
     *
     * @type {string}
     */
    public get value (): string {
        return this.getValue();
    }

    /**
     * checkAndGetValue - checks if "value" is a correct "character string" value, throws
     * the error if "value" has incorrect type.
     *
     * @param  {string} value - "character string" value
     * @return {string}
     */
    private checkAndGetValue (value: string): string {
        if (!_.isString(value)) {
            throw new BACnetError('BACnetCharacterString - updateValue: Value must be of type "character string"!');
        }

        return value;
    }

    /**
     * HELPERs
     */

    /**
     * getStringEncode - returns the "string" representation of the character
     * encoding.
     *
     * @param  {number} charSet - character encoding
     * @return {string}
     */
    private getStringEncode (charSet: number): string {
        switch (charSet) {
            case 0:
            default:
                return 'utf8';
        }
    }
}
