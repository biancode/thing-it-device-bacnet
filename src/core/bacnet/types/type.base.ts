import { APIError } from '../errors';

import { BACnetReaderUtil, BACnetWriterUtil } from '../utils';

import { IBACnetTag } from '../interfaces';

export class BACnetTypeBase {
    public readonly className: string = 'BACnetTypeBase';
    protected tag: IBACnetTag;
    protected data: any;

    static readParam (reader: BACnetReaderUtil, changeOffset?: boolean): any {
        const inst = new this();
        inst.readValue(reader, changeOffset);
        return inst;
    }

    /**
     * readValue - parses the message with BACnet value.
     *
     * @param  {BACnetReaderUtil} reader - BACnet reader with "unsigned integer" BACnet value
     * @param  {type} [changeOffset = true] - change offset in the buffer of reader
     * @return {void}
     */
    public readValue (reader: BACnetReaderUtil, changeOffset?: boolean): void { ; }

    /**
     * writeValue - writes the BACnet value.
     *
     * @param  {BACnetWriterUtil} writer - BACnet writer
     * @return {void}
     */
    public writeValue (writer: BACnetWriterUtil): void { ; }

    public writeParam (writer: BACnetWriterUtil, tag: IBACnetTag): void {
        throw new APIError(`${this.className} - writeParam: Not implemented yet`);
    }

    /**
     * setValue - sets the new internal state.
     *
     * @param  {any} newValue - new "unsigned integer" value
     * @return {void}
     */
    public setValue (newValute: any): void { ; }

    /**
     * getValue - returns the internal state.
     *
     * @return {any}
     */
    public getValue (): any { ; }

    /**
     * value - sets the new internal state
     *
     * @type {any}
     */
    public get value (): any { return null; }

    /**
     * value - returns the internal state..
     *
     * @type {any}
     */
    public set value (newValute: any) { ; }

    /**
     * getTag - returns the BACnet tag.
     *
     * @return {IBACnetTag}
     */
    public getTag (): IBACnetTag {
        return this.tag;
    }
}
