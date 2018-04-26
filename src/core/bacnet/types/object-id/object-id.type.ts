import * as _ from 'lodash';

import { BACnetTypeBase } from '../type.base';

import {
    BACnetPropTypes,
    BACnetTagTypes,
} from '../../enums';

import {
    IBACnetTag,
    IBACnetTypeObjectId,
} from '../../interfaces';

import { BACnetError } from '../../errors';

import { BACnetReaderUtil, BACnetWriterUtil } from '../../utils';

export class BACnetObjectId extends BACnetTypeBase {
    public readonly className: string = 'BACnetObjectId';
    public readonly type: BACnetPropTypes = BACnetPropTypes.objectIdentifier;

    protected tag: IBACnetTag;
    protected data: IBACnetTypeObjectId;

    constructor (defValue?: IBACnetTypeObjectId) {
        super();

        this.data = _.isUndefined(defValue)
            ? { type: 0, instance: 0 }
            : this.checkAndGetValue(_.clone(defValue));
    }

    static readParam (reader: BACnetReaderUtil, changeOffset?: boolean): BACnetObjectId {
        return super.readParam(reader, changeOffset);
    }

    /**
     * readValue - parses the message with BACnet "object identifier" value.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "object identifier" BACnet value
     * @param  {type} [changeOffset = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReaderUtil, changeOffset: boolean = true): void {
        const tag = reader.readTag(changeOffset);
        this.tag = tag;

        const objId = reader.readUInt32BE(changeOffset);
        const objIdPayload = reader.decodeObjectIdentifier(objId);

        this.data = objIdPayload;
    }

    /**
     * writeValue - writes the BACnet "object identifier" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriterUtil): void {
        this.writeParam(writer, {
            num: BACnetPropTypes.objectIdentifier,
            type: BACnetTagTypes.application,
        });
    }

    /**
     * writeParam - writes the BACnet Param as "object identifier" value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @param  {IBACnetTag} tag - BACnet tag
     * @return {void}
     */
    public writeParam (writer: BACnetWriterUtil, tag: IBACnetTag): void {
        const dataSize: number = 4;
        // Tag Number - Tag Type - Param Length (bytes)
        writer.writeTag(tag.num, tag.type, dataSize);
        // Write "object identifier" value
        const objectIdentifier = ((this.data.type & 0x03FF) << 22)
            | (this.data.instance & 0x03FFFFF);
        writer.writeUInt32BE(objectIdentifier);
    }

    /**
     * setValue - sets the new BACnet "object identifier" value as internal state.
     *
     * @param  {IBACnetTypeObjectId} newValue - new "object identifier" value
     * @return {void}
     */
    public setValue (newValue: IBACnetTypeObjectId): void {
        this.data = this.checkAndGetValue(_.clone(newValue));
    }

    /**
     * getValue - returns the internal state as current BACnet "object identifier" value.
     *
     * @return {IBACnetTypeObjectId}
     */
    public getValue (): IBACnetTypeObjectId {
        return _.cloneDeep(this.data);
    }

    /**
     * value - sets the new BACnet "object identifier" value as internal state
     *
     * @type {IBACnetTypeObjectId}
     */
    public set value (newValue: IBACnetTypeObjectId) {
        this.setValue(newValue);
    }

    /**
     * value - returns the internal state as current BACnet "object identifier" value.
     *
     * @type {IBACnetTypeObjectId}
     */
    public get value (): IBACnetTypeObjectId {
        return this.getValue();
    }

    /**
     * checkAndGetValue - checks if "value" is a correct "object identifier" value,
     * throws the error if "value" has incorrect type.
     *
     * @param  {IBACnetTypeObjectId} value - "object identifier" value
     * @return {IBACnetTypeObjectId}
     */
    private checkAndGetValue (value: IBACnetTypeObjectId): IBACnetTypeObjectId {
        if (!_.has(value, 'type') || !_.has(value, 'instance')) {
            throw new BACnetError('BACnetObjectId - updateValue: Value must be of type "object identifier"!');
        }

        return value;
    }
}
