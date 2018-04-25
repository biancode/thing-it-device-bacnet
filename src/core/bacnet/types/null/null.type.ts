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

export class BACnetNull extends BACnetTypeBase {
    public readonly className: string = 'BACnetNull';
    public readonly type: BACnetPropTypes = BACnetPropTypes.nullData;

    protected tag: IBACnetTag;

    constructor () {
        super();
    }

    /**
     * readValue - parses the message with BACnet "null" value.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "null" BACnet value
     * @param  {type} [changeOffset = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReaderUtil, changeOffset: boolean = true): void {
        const tag = reader.readTag(changeOffset);
        this.tag = tag;
    }

    /**
     * writeValue - writes the BACnet "null" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriterUtil): void {
        writer.writeTag(BACnetPropTypes.nullData, 0, 0);
    }

    /**
     * writeParam - writes the BACnet Param as "null" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @param  {IBACnetTag} tag - BACnet tag
     * @return {void}
     */
    public writeParam (writer: BACnetWriterUtil, tag: IBACnetTag): void {
        const dataSize: number = 1;
        // Tag Number - Tag Type - Param Length (bytes)
        writer.writeTag(tag.num, tag.type, dataSize);
        // Write "null" value
        writer.writeUIntValue(0);
    }

    /**
     * setValue - sets the new BACnet "null" value as internal state.
     *
     * @param  {null} newValue - new "null" value
     * @return {void}
     */
    public setValue (newValue: null): void {
    }

    /**
     * getValue - returns the internal state as current BACnet "null" value.
     *
     * @return {null}
     */
    public getValue (): null {
        return null;
    }

    /**
     * value - sets the new BACnet "null" value as internal state
     *
     * @type {null}
     */
    public set value (newValue: null) {
        this.setValue(newValue);
    }

    /**
     * value - returns the internal state as current BACnet "null" value.
     *
     * @type {null}
     */
    public get value (): null {
        return this.getValue();
    }
}
