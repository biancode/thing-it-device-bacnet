import {
    BACnetPropertyId,
    BACnetTagTypes,
} from '../enums';

import * as BACnetTypes from '../types';

export interface IBACnetObjectProperty {
    id: BACnetPropertyId;
    payload: BACnetTypes.BACnetTypeBase | BACnetTypes.BACnetTypeBase[];
    writable?: boolean;
    priority?: number;
    index?: number;
    commandable?: boolean;
}

export interface IBACnetTag {
    num: number;
    type: BACnetTagTypes;
    value: number;
}


/**
 * Types
 */

export interface IBACnetTypeObjectId {
    type: number; // enum
    instance: number;
}

export interface IBACnetTypeStatusFlags {
    inAlarm?: boolean,
    fault?: boolean,
    overridden?: boolean,
    outOfService?: boolean,
}
