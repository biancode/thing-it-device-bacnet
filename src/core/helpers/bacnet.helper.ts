import * as _ from 'lodash';
import * as BACnetLogic from 'bacnet-logic';

import * as Errors from '../errors';

export class BACnet {

    /**
     * Returns the BACnet Object Identifier.
     *
     * @static
     * @param  {string|number} objectType - instance of the BACnet object
     * @param  {string|BACnetLogic.Enums.ObjectType} objectType - type of the BACnet object
     * @param  {BACnetLogic.Enums.ObjectType} [defObjectType] - default type of the BACnet object
     * @return {BACnetLogic.Types.BACnetObjectId}
     */
    static getBACnetObjectId (objectId: string|number, objectType?: string|BACnetLogic.Enums.ObjectType,
            defObjectType?: BACnetLogic.Enums.ObjectType): BACnetLogic.Types.BACnetObjectId {
        const bacnetObjectId = +objectId;

        if ((_.isString(objectId) && objectId === '') || !_.isFinite(bacnetObjectId)) {
            throw new Errors.APIError(`CommonDevice - getObjectId: `
                + `Object ID must have the valid BACnet object instance number. Current value: ${objectId}`);
        }

        let bacnetObjectType: BACnetLogic.Enums.ObjectType;
        if (_.isNumber(objectType)) {
            bacnetObjectType = objectType;
        } else {
            bacnetObjectType = !_.isNil(objectType) && objectType !== ''
                ? BACnetLogic.Enums.ObjectType[objectType]
                : defObjectType;
        }

        if (!_.isNumber(bacnetObjectType)) {
            throw new Errors.APIError(`CommonDevice - getObjectId: `
                + `Object Type must have the valid BACnet object type. Current type: ${objectType}`);
        }

        return new BACnetLogic.Types.BACnetObjectId({
            type: bacnetObjectType,
            instance: bacnetObjectId,
        });
    }
}
