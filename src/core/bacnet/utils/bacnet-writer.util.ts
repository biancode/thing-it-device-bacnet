import * as _ from 'lodash';

import { BACnetError } from '../errors';

import {
    IBACnetTypeObjectId,
    IBACnetTag,
} from '../interfaces';

import {
    OpertionMaxValue,
} from '../enums';

import { OffsetUtil } from './offset.util';

import * as BACnetTypes from '../types';

export class BACnetWriterUtil {
    public offset: OffsetUtil;
    private buffer: Buffer;

    constructor (resultBuf?: Buffer) {
        this.offset = new OffsetUtil(0);

        if (!resultBuf) {
            this.buffer = Buffer.alloc(0);
            return;
        }
        this.buffer = resultBuf;
        const offsetValue = resultBuf.length;
        this.offset = new OffsetUtil(offsetValue);
    }

    /**
     * size - returns the size of internal buffer.
     *
     * @return {number}
     */
    get size (): number {
        return this.buffer.length;
    }

    /**
     * concat - concatenates the writers and returns the writer with common buffer.
     *
     * @static
     * @param  {BACnetWriterUtil[]} restsOfWriters - description
     * @return {type}
     */
    static concat (...restsOfWriters: BACnetWriterUtil[]) {
        const resultBuf = _.reduce(restsOfWriters, (result, writer) => {
            const bufOfWriter = writer.getBuffer();
            return Buffer.concat([result, bufOfWriter]);
        }, Buffer.alloc(0));
        return new BACnetWriterUtil(resultBuf);
    }

    public getBuffer () {
        return this.buffer;
    }

    /**
     * increasBufferSize - increases the size of the internal buffer.
     *
     * @param  {number} len - new size
     * @return {void}
     */
    private increasBufferSize (size: number): void {
        const newBuffer = Buffer.alloc(size);
        this.buffer = Buffer.concat([this.buffer, newBuffer]);
    }

    /**
     * writeUInt8 - writes 1 byte to the internal buffer.
     *
     * @param  {number} value - data
     * @return {void}
     */
    public writeUInt8 (value: number): void {
        this.increasBufferSize(1);
        this.buffer.writeUInt8(value, this.offset.inc());
    }

    /**
     * writeUInt16BE - writes 2 bytes to the internal buffer.
     *
     * @param  {number} value - data
     * @return {void}
     */
    public writeUInt16BE (value: number): void {
        this.increasBufferSize(2);
        this.buffer.writeUInt16BE(value, this.offset.inc(2));
    }

    /**
     * writeUInt32BE - writes 4 bytes (integer) to the internal buffer.
     *
     * @param  {number} value - data
     * @return {void}
     */
    public writeUInt32BE (value: number): void {
        this.increasBufferSize(4);
        this.buffer.writeUInt32BE(value, this.offset.inc(4));
    }

    /**
     * writeFloatBE - writes 4 bytes (real) to the internal buffer.
     *
     * @param  {number} value - data
     * @return {void}
     */
    public writeFloatBE (value: number): void {
        this.increasBufferSize(4);
        this.buffer.writeFloatBE(value, this.offset.inc(4));
    }

    /**
     * writeString - reads the N bytes from the internal buffer and converts
     * the result to the string.
     *
     * @param  {string} encoding - character encoding
     * @param  {number} len - lenght of string
     * @return {string}
     */
    public writeString (str: string, encoding: string = 'utf8'): void {
        const strLen = str.length;
        const offStart = this.offset.inc(strLen);
        this.increasBufferSize(strLen);
        this.buffer.write(str, offStart, strLen, encoding);
    }

    /**
     * writeTag - writes BACnet tag to the internal buffer.
     *
     * @param  {number} tagNumber - tag number/context
     * @param  {number} tagClass - tag class
     * @param  {number} tagValue - tag value
     * @return {void}
     */
    public writeTag (
            tagNumber: number, tagClass: number, tagValue: number): void {
        // Tag = Tag Number 4 bits, Tag Class 1 bits, Tag Value 3 bits
        const tag = ((tagNumber & 0x0F) << 4)
            | ((tagClass & 0x01) << 3)
            | (tagValue & 0x07);
        this.writeUInt8(tag);
    }

    /**
     * writeObjectIdentifier - writes BACnet object identifier to the internal buffer.
     *
     * @param  {IBACnetTypeObjectId} objId - object identifier
     * @return {void}
     */
    public writeObjectIdentifier (objId: IBACnetTypeObjectId): void {
        // Object Identifier = Object Type 10 bits, Object ID 22 bits
        const objectIdentifier = ((objId.type & 0x03FF) << 22)
            | (objId.instance & 0x03FFFFF);
        this.writeUInt32BE(objectIdentifier);
    }

    /**
     * writeValue - writes BACnet property value to the internal buffer.
     *
     * @param  {BACnetTypes.BACnetTypeBase|BACnetTypes.BACnetTypeBase[]} propValues - bacnet property value
     * @param  {IBACnetTag} tag - bacnet tag
     * @return {void}
     */
    public writeValue (propValues: BACnetTypes.BACnetTypeBase | BACnetTypes.BACnetTypeBase[],
            tag: IBACnetTag): void {
        // Context Number - Context tag - "Opening" Tag
        this.writeTag(tag.num, tag.type, 6);

        let values: BACnetTypes.BACnetTypeBase[] = _.isArray(propValues)
            ? propValues : [ propValues ];

        _.map(values, (value) => {
            value.writeValue(this);
        });

        // Context Number - Context tag - "Closing" Tag
        this.writeTag(tag.num, tag.type, 7);
    }

    /**
     * writeUIntValue - writes unsigned integer value to the internal buffer.
     *
     * @param  {number} uIntValue - unsigned int value
     * @return {void}
     */
    public writeUIntValue (uIntValue: number): void {
        // DataType - Application tag - DataTypeSize
        if (uIntValue <= OpertionMaxValue.uInt8) {
            this.writeUInt8(uIntValue);
        } else if (uIntValue <= OpertionMaxValue.uInt16) {
            this.writeUInt16BE(uIntValue);
        } else if (uIntValue <= OpertionMaxValue.uInt32) {
            this.writeUInt32BE(uIntValue);
        }
    }
}
