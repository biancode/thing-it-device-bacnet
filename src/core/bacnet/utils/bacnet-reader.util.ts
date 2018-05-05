import * as _ from 'lodash';

import * as Errors from '../errors';

import {
    IBACnetPropertyValue,
    IBACnetReaderOptions,
} from '../interfaces';

import * as Enums from '../enums';

import * as BACnetTypes from '../types';

import { BACnetReader } from '../io';

export class BACnetReaderUtil {
    /**
     * Reads BACnet property from buffer of the reader.
     *
     * @return {Map<string, any>}
     */
    static readProperty (reader: BACnetReader, opts?: IBACnetReaderOptions): IBACnetPropertyValue {
        const propId = BACnetTypes.BACnetEnumerated.readParam(reader);
        const propIndex = BACnetTypes.BACnetUnsignedInteger.readParam(reader, { optional: true });
        const propValues = BACnetReaderUtil.readPropertyValues(reader, opts);
        const propPriority = BACnetTypes.BACnetUnsignedInteger.readParam(reader, { optional: true });

        return {
            id: propId,
            index: propIndex,
            values: propValues,
            priority: propPriority,
        };
    }

    /**
     * Reads BACnet properties from buffer of the reader.
     *
     * @return {Map<string, any>}
     */
    static readProperties (reader: BACnetReader, opts?: IBACnetReaderOptions): IBACnetPropertyValue[] {
        // Context Number - Context tag - "Opening" Tag
        const openTag = reader.readTag(opts);

        const params: IBACnetPropertyValue[] = [];
        while (true) {
            const paramValueTag = reader.readTag({ silent: true });

            if (reader.isClosingTag(paramValueTag)) {
                // Context Number - Context tag - "Closing" Tag
                break;
            }

            const param = this.readProperty(reader, opts);

            params.push(param);
        }

        return params;
    }

    /**
     * Reads the list of BACnet property values from buffer of the reader.
     *
     * @return {Map<string, any>}
     */
    static readPropertyValues (reader: BACnetReader, opts?: IBACnetReaderOptions): BACnetTypes.BACnetTypeBase[] {
        // Context Number - Context tag - "Opening" Tag
        const openTag = reader.readTag(opts);

        const paramValues: BACnetTypes.BACnetTypeBase[] = [];
        while (true) {
            const paramValueTag = reader.readTag({ silent: true });

            if (reader.isClosingTag(paramValueTag)) {
                // Context Number - Context tag - "Closing" Tag
                break;
            }
            const paramValueType: Enums.BACnetPropTypes = paramValueTag.num;

            let inst: BACnetTypes.BACnetTypeBase;
            switch (paramValueType) {
                case Enums.BACnetPropTypes.boolean:
                    inst = new BACnetTypes.BACnetBoolean();
                    break;
                case Enums.BACnetPropTypes.unsignedInt:
                    inst = new BACnetTypes.BACnetUnsignedInteger();
                    break;
                case Enums.BACnetPropTypes.real:
                    inst = new BACnetTypes.BACnetReal();
                    break;
                case Enums.BACnetPropTypes.characterString:
                    inst = new BACnetTypes.BACnetCharacterString();
                    break;
                case Enums.BACnetPropTypes.bitString:
                    inst = new BACnetTypes.BACnetStatusFlags();
                    break;
                case Enums.BACnetPropTypes.enumerated:
                    inst = new BACnetTypes.BACnetEnumerated();
                    break;
                case Enums.BACnetPropTypes.objectIdentifier:
                    inst = new BACnetTypes.BACnetObjectId();
                    break;
            }
            inst.readValue(reader, opts);

            paramValues.push(inst);
        }

        return paramValues;
    }
}
