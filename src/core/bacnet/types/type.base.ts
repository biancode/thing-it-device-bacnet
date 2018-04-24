
import { BACnetReaderUtil, BACnetWriterUtil } from '../utils';

import { IBACnetTag } from '../interfaces';

export abstract class BACnetTypeBase {
    public readonly className: string = 'BACnetTypeBase';
    protected tag: IBACnetTag;
    protected data: any;

    /**
     * readValue - parses the message with BACnet value.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "unsigned integer" BACnet value
     * @param  {type} [changeOffset = true] - change offset in the buffer of reader
     * @return {void}
     */
    abstract readValue (reader: BACnetReaderUtil, changeOffset?: boolean): void;

    /**
     * writeValue - writes the BACnet value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @return {void}
     */
    abstract writeValue (writer: BACnetWriterUtil): void;

    /**
     * setValue - sets the new internal state.
     *
     * @param  {any} newValue - new "unsigned integer" value
     * @return {void}
     */
    abstract setValue (newValute: any): void;

    /**
     * getValue - returns the internal state.
     *
     * @return {any}
     */
    abstract getValue (): any;

    /**
     * value - sets the new internal state
     *
     * @type {any}
     */
    abstract get value (): any;

    /**
     * value - returns the internal state..
     *
     * @type {any}
     */
    abstract set value (newValute: any);

    /**
     * getTag - returns the BACnet tag.
     *
     * @return {IBACnetTag}
     */
    public getTag (): IBACnetTag {
        return this.tag;
    }
}
