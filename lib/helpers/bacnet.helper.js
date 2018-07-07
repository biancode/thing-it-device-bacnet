"use strict";
var _ = require("lodash");
var BACnetLogic = require("tid-bacnet-logic");
var Errors = require("../errors");

function BACnet() {
}
/**
 * Returns the BACnet Object Identifier.
 *
 * @static
 * @param  {string|number} objectType - instance of the BACnet object
 * @param  {string|BACnetLogic.Enums.ObjectType} objectType - type of the BACnet object
 * @param  {BACnetLogic.Enums.ObjectType} [defObjectType] - default type of the BACnet object
 * @return {BACnetLogic.Types.BACnetObjectId}
 */
BACnet.getBACnetObjectId = function (objectId, objectType, defObjectType) {
    var bacnetObjectId = +objectId;
    if ((_.isString(objectId) && objectId === '') || !_.isFinite(bacnetObjectId)) {
        throw new Errors.APIError("BACnet - getBACnetObjectId: "
            + ("Object ID must have the valid BACnet object instance number. Current value: " + objectId));
    }
    var bacnetObjectType;
    if (_.isNumber(objectType)) {
        bacnetObjectType = objectType;
    }
    else {
        bacnetObjectType = !_.isNil(objectType) && objectType !== ''
            ? BACnetLogic.Enums.ObjectType[objectType]
            : defObjectType;
    }
    if (!_.isNumber(bacnetObjectType)) {
        throw new Errors.APIError("BACnet - getBACnetObjectId: "
            + ("Object Type must have the valid BACnet object type. Current type: " + objectType));
    }
    return new BACnetLogic.Types.BACnetObjectId({
        type: bacnetObjectType,
        instance: bacnetObjectId,
    });
};

module.exports = BACnet;
