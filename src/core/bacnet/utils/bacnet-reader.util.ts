import * as _ from 'lodash';

import { BACnetError } from '../errors';

import {
    IBACnetTag,
    IBACnetTypeObjectId,
} from '../interfaces';

import {
    BACnetPropertyId,
    BACnetPropTypes,
    BACnetTagTypes,
} from '../enums';

import { OffsetUtil } from './offset.util';
import { TyperUtil } from './typer.util';

import * as BACnetTypes from '../types';

export class BACnetReaderUtil {
    public offset: OffsetUtil;

    constructor (private buffer: Buffer) {
        this.offset = new OffsetUtil(0);
    }

    /**
     * getRange - returns the part of buffer from "start" to the "end" position.
     *
     * @param  {number} start - start position
     * @param  {number} end - end position
     * @return {Buffer}
     */
    public getRange (start: number, end?: number): Buffer {
        return this.buffer.slice(start, end);
    }

    /**
     * readUInt8 - reads the 1 byte from the internal buffer.
     *
     * @return {number}
     */
    public readUInt8 (changeOffset: boolean = true): number {
        const offset = this.offset.getVaule();
        return changeOffset
            ? this.buffer.readUInt8(this.offset.inc())
            : this.buffer.readUInt8(offset);
    }

    /**
     * readUInt16BE - reads the 2 bytes from the internal buffer.
     *
     * @return {number}
     */
    public readUInt16BE (changeOffset: boolean = true): number {
        const offset = this.offset.getVaule();
        return changeOffset
            ? this.buffer.readUInt16BE(this.offset.inc(2))
            : this.buffer.readUInt16BE(offset);
    }

    /**
     * readUInt32BE - reads the 4 bytes (int) from the internal buffer.
     *
     * @return {number}
     */
    public readUInt32BE (changeOffset: boolean = true): number {
        const offset = this.offset.getVaule();
        return changeOffset
            ? this.buffer.readUInt32BE(this.offset.inc(4))
            : this.buffer.readUInt32BE(offset);
    }

    /**
     * readFloatBE - reads the 4 bytes (float) from the internal buffer.
     *
     * @return {number}
     */
    public readFloatBE (changeOffset: boolean = true): number {
        const offset = this.offset.getVaule();
        return changeOffset
            ? this.buffer.readFloatBE(this.offset.inc(4))
            : this.buffer.readFloatBE(offset);
    }

    /**
     * readString - reads the N bytes from the internal buffer and converts
     * the result to the string.
     *
     * @param  {string} encoding - character encoding
     * @param  {number} len - lenght of string
     * @return {string}
     */
    public readString (encoding: string, len: number, changeOffset: boolean = true): string {
        let offStart: number, offEnd: number;
        if (changeOffset) {
            offStart = this.offset.inc(len);
            offEnd = this.offset.getVaule();
        } else {
            offStart = this.offset.getVaule();
            offEnd = offStart + len;
        }
        return this.buffer.toString(encoding, offStart, offEnd);
    }

    /**
     * readTag - reads the BACnet tag from the internal buffer and returns map with:
     * - number = tag number (number)
     * - class = tag class (number)
     * - value = tag value (number)
     *
     * @return {Map<string, number>}
     */
    public readTag (changeOffset: boolean = true): IBACnetTag {
        let tagData: IBACnetTag;

        const tag = this.readUInt8(changeOffset);

        const tagNumber = tag >> 4;

        const tagType = (tag >> 3) & 0x01;

        const tagValue = tag & 0x07;

        tagData = {
            num: tagNumber,
            type: tagType,
            value: tagValue,
        }

        return tagData;
    }


    /**
     * readObjectIdentifier - reads the BACnet object identifier from the internal
     * buffer and returns map with:
     * - tag = param tag (tag map)
     * - type = object type (number)
     * - instance = object instance (number)
     *
     * @return {Map<string, any>}
     */
    public readObjectIdentifier (changeOffset: boolean = true): BACnetTypes.BACnetObjectId {
        const inst = new BACnetTypes.BACnetObjectId();
        inst.readValue(this);

        return inst;
    }

    /**
     * decodeObjectIdentifier - decodes the Object Identifier and returns the
     * map with object type and object instance.
     *
     * @param  {number} objId - 4 bytes of object identifier
     * @return {Map<string, any>}
     */
    public decodeObjectIdentifier (objId: number): IBACnetTypeObjectId {
        let objIdPayload: IBACnetTypeObjectId;
        const objType = (objId >> 22) & 0x03FF;

        const objInstance = objId & 0x03FFFFF;

        objIdPayload = {
            type: objType,
            instance: objInstance,
        };

        return objIdPayload;
    }

    /**
     * readParam - reads the BACnet param from the internal buffer and returns
     * map with:
     * - tag = param tag (tag map)
     * - value = param value (number)
     *
     * @return {Map<string, any>}
     */
    public readParam (changeOffset: boolean = true): BACnetTypes.BACnetUnsignedInteger {
        const inst = new BACnetTypes.BACnetUnsignedInteger();
        inst.readValue(this, changeOffset);

        return inst;
    }

    /**
     * readParamValue - reads the param value from internal buffer.
     *
     * @return {Map<string, any>}
     */
    public readParamValue (changeOffset: boolean = true): BACnetTypes.BACnetTypeBase[] {
        const paramValuesMap: Map<string, any> = new Map();

        // Context Number - Context tag - "Opening" Tag
        const openTag = this.readTag(changeOffset);

        const paramValues: BACnetTypes.BACnetTypeBase[] = [];
        while (true) {
            const paramValueTag = this.readTag(false);

            if (this.isClosingTag(paramValueTag)) {
                // Context Number - Context tag - "Closing" Tag
                break;
            }
            const paramValueType: BACnetPropTypes = paramValueTag.num;

            let inst: BACnetTypes.BACnetTypeBase;
            switch (paramValueType) {
                case BACnetPropTypes.boolean:
                    inst = new BACnetTypes.BACnetBoolean();
                    break;
                case BACnetPropTypes.unsignedInt:
                    inst = new BACnetTypes.BACnetUnsignedInteger();
                    break;
                case BACnetPropTypes.real:
                    inst = new BACnetTypes.BACnetReal();
                    break;
                case BACnetPropTypes.characterString:
                    inst = new BACnetTypes.BACnetCharacterString();
                    break;
                case BACnetPropTypes.bitString:
                    inst = new BACnetTypes.BACnetStatusFlags();
                    break;
                case BACnetPropTypes.enumerated:
                    inst = new BACnetTypes.BACnetEnumerated();
                    break;
                case BACnetPropTypes.objectIdentifier:
                    inst = new BACnetTypes.BACnetObjectId();
                    break;
            }
            inst.readValue(this, changeOffset);

            paramValues.push(inst);
        }

        return paramValues;
    }

    /**
     * isOpeningTag - return true if tag is an opening tag
     *
     * @param  {Map<string,number>} tag - tag
     * @return {boolean}
     */
    public isOpeningTag (tag: IBACnetTag): boolean {
        return tag.type === BACnetTagTypes.context
            && tag.value === 0x06;
    }

    /**
     * isClosingTag - return true if tag is a closing tag
     *
     * @param  {Map<string,number>} tag - tag
     * @return {boolean}
     */
    public isClosingTag (tag: IBACnetTag): boolean {
        return tag.type === BACnetTagTypes.context
            && tag.value === 0x07;
    }
}
