"use strict";
var _ = require("lodash");
function FlowFilter() {
}
/**
 * Creates filter for flow, compares the BACnet service types.
 * Branches:
 * - If service type does not exist in response, filter will return "false".
 * - If service type from response do not equal to service type from arguments,
 * filter will return "false".
 * - If service type from response equal to service type from arguments,
 * filter will return "true".
 *
 * @return {BACnetFlowFilter}
 */
FlowFilter.isServiceType = function (serviceType) {
    return function (resp) {
        var respServiceType = _.get(resp, 'layer.apdu.type', null);
        return !_.isNil(respServiceType) && respServiceType === serviceType;
    };
};
/**
 * Creates filter for flow, compares the BACnet service choices.
 * Branches:
 * - If service choice does not exist in response, filter will return "false".
 * - If service choice from response do not equal to service choice from arguments,
 * filter will return "false".
 * - If service choice from response equal to service choice from arguments,
 * filter will return "true".
 *
 * @return {BACnetFlowFilter}
 */
FlowFilter.isServiceChoice = function (serviceChoice) {
    return function (resp) {
        var respServiceChoice = _.get(resp, 'layer.apdu.serviceChoice', null);
        return !_.isNil(respServiceChoice) && respServiceChoice === serviceChoice;
    };
};
/**
 * Creates filter for flow, compares the BACnet object IDs.
 * Branches:
 * - If object identifier does not exist in response, filter will return "false".
 * - If object identifier from response do not equal to object identifier from arguments,
 * filter will return "false".
 * - If object identifier from response equal to object identifier from arguments,
 * filter will return "true".
 *
 * @return {BACnetFlowFilter}
 */
FlowFilter.isBACnetObject = function (objId) {
    return function (resp) {
        var respObjId = _.get(resp, 'layer.apdu.service.objId', null);
        return !_.isNil(respObjId) && respObjId.isEqual(objId);
    };
};
/**
 * Creates filter for flow, compares the BACnet property IDs.
 * Branches:
 * - If property identifier does not exist in response, filter will return "false".
 * - If property identifier from response do not equal to property identifier from arguments,
 * filter will return "false".
 * - If property identifier from response equal to property identifier from arguments,
 * filter will return "true".
 *
 * @return {BACnetFlowFilter}
 */
FlowFilter.isBACnetProperty = function (propId) {
    return function (resp) {
        var respPropId = _.get(resp, 'layer.apdu.service.prop.id', null);
        return !_.isNil(respPropId) && respPropId.isEqual(propId);
    };
};
/**
 * Creates filter for flow, compares the BACnet vendor IDs.
 * Branches:
 * - If vendor identifier does not exist in response, filter will return "false".
 * - If vendor identifier from response do not equal to vendor identifier from arguments,
 * filter will return "false".
 * - If vendor identifier from response equal to vendor identifier from arguments,
 * filter will return "true".
 *
 * @return {BACnetFlowFilter}
 */
FlowFilter.isBACnetVendorId = function (vendorId) {
    return function (resp) {
        var respVendorId = _.get(resp, 'layer.apdu.service.vendorId', null);
        return !_.isNil(respVendorId) && respVendorId.isEqual(vendorId);
    };
};
/**
 * Creates filter for flow, compares the BACnet device IP address.
 * Branches:
 * - If IP address does not exist in response, filter will return "false".
 * - If IP address from response do not equal to IP address from arguments,
 * filter will return "false".
 * - If IP address from response equal to IP address from arguments,
 * filter will return "true".
 *
 * @return {BACnetFlowFilter}
 */
FlowFilter.isBACnetIPAddress = function (ipAddress) {
    return function (resp) {
        var respAddrInfo = resp.socket.getAddressInfo();
        return respAddrInfo.address === ipAddress;
    };
};
/**
 * Creates filter for flow, compares the BACnet device IP address.
 * Branches:
 * - If IP address does not exist in response, filter will return "false".
 * - If IP address from response do not equal to IP address from arguments,
 * filter will return "false".
 * - If IP address from response equal to IP address from arguments,
 * filter will return "true".
 *
 * @return {BACnetFlowFilter}
 */
FlowFilter.matchFilter = function (isRequired, filterFn, matchName) {
    if (_.isNil(matchName)) { matchName = 'object'; }
    return function (resp) {
        return !isRequired || filterFn(resp);
    };
};

module.exports = FlowFilter;
