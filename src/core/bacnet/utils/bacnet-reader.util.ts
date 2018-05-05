import * as _ from 'lodash';

import * as Errors from '../errors';

import {
    IBACnetPropertyValue,
    IBACnetReaderOptions,
} from '../interfaces';

import {
    BACnetPropTypes,
} from '../enums';

import * as Enums from '../enums';

import * as BACnetTypes from '../types';

import { BACnetReader } from '../io';

export class BACnetReaderUtil {
    /**
     * Reads BACnet property from reader buffer.
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
     * Reads the list of BACnet param values from reader buffer.
     *
     * @return {Map<string, any>}
     */
    static readPropertyValues (reader: BACnetReader, opts?: IBACnetReaderOptions): BACnetTypes.BACnetTypeBase[] {
        const paramValuesMap: Map<string, any> = new Map();

        // Context Number - Context tag - "Opening" Tag
        const openTag = reader.readTag(opts);

        const paramValues: BACnetTypes.BACnetTypeBase[] = [];
        while (true) {
            const paramValueTag = reader.readTag({ silent: true });

            if (reader.isClosingTag(paramValueTag)) {
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
            inst.readValue(reader, opts);

            paramValues.push(inst);
        }

        return paramValues;
    }
}
