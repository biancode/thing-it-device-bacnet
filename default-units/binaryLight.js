module.exports = {
    metadata: {
        plugin: "binaryLight",
        label: "BACnet Binary Light Control",
        role: "actor",
        family: "binaryLight",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [
            {
                id: "on",
                label: "On"
            }, {
                id: "off",
                label: "Off"
            }, {
                id: "toggle",
                label: "Toggle"
            }, {
                id: "update",
                label: "Update"
            }
        ],
        state: [
            {
                id: 'initialized', label: 'Initialized',
                type: {
                    id: 'boolean',
                },
            },
            {
                id: "lightActive", label: "Light Active",
                type: {
                    id: "boolean"
                }
            }],
        configuration: [
            {
                label: "Light Active Object Id",
                id: "lightActiveObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Light Active Object Type",
                id: "lightActiveObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }

        ]
    },
    create: function () {
        "use strict";
        return new BinaryLight();
    }
};

var _ = require("lodash");
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;
var RxOp = require("rxjs/operators");
var store = require("../lib/redux").store;
/* Plugin devices */
var APIError = require("../lib/errors").APIError;
var Managers = require("../lib/managers");
var Helpers = require("../lib/helpers");
var BACnet = require("tid-bacnet-logic");
var Logger = require("../lib/utils").Logger;
var Enums = require("../lib/enums");

/**
 *
 */
function BinaryLight() { 
}

function BinaryLightDiscovery() {   
}

BinaryLightDiscovery.prototype.start = function () {
}

BinaryLightDiscovery.prototype.stop = function () {
}
/**
 *
 */
BinaryLight.prototype.className = 'BinaryLightActorDevice';

BinaryLight.prototype.start = function () {
    // Init the default state
    this.setState(this.state);

    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
BinaryLight.prototype.stop = function () {
    this.isDestroyed = true;

    // Sends the 'unsubscribeCOV' request to the BACnet Device
    _.map(this.covObjectIds, (function (objectId) {
        this.apiService.confirmedReq.unsubscribeCOV({
            invokeId: 1,
            objId: objectId,
            subProcessId: new BACnet.Types.BACnetUnsignedInteger(0),
        });
    }).bind(this));

    this.subManager.destroy();
    this.subManager = null;    
};

BinaryLight.prototype.initDevice = function () {
    // Init the default state
    this.setState(this.state);

    this.state.initialized = false;

    this.config = this.configuration;

    if (!this.config) {
        throw new APIError('initDevice - Configuration is not defined!');
    }
    this.logger = this.createLogger();

    // Inits specific internal properties
    this.logger.logDebug("BACNetActor - initDevice: "
        + "Inits specific internal properties");
    this.initParamsFromConfig();

    // Creates instances of the plugin componets
    this.logger.logDebug('BACNetActor - initDevice: '
    + 'Creates instances of the plugin componets');
    this.createPluginComponents();

    // Creates 'subscribtion' to the BACnet object properties
    this.subscribeToProperty();

    // Inits the BACnet object properties
    this.initProperties();

    this.state.initialized = true;
    this.publishStateChange();
}

/**
 * initSubManager - initializes actor subscription manager and
 * covObjectIds array.
 *
 * @return {Promise<any>}
 */
BinaryLight.prototype.initSubManager = function () {

    this.covObjectIds = [];
    this.subManager = new Managers.SubscriptionManager();
    return Bluebird.resolve(this.subManager.initManager());
}

/**
 * Creates and inits params of the BACnet Analog Input from plugin configuration.
 * Steps:
 * - creates and inits 'objectId'.
 *
 * @return {void}
 */
BinaryLight.prototype.initParamsFromConfig = function () {
    this.objectId = Helpers.BACnet.getBACnetObjectId(
        this.config.lightActiveObjectId,
        this.config.lightActiveObjectType,
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
BinaryLight.prototype.createPluginComponents = function () {
    /* Create and init BACnet Flow Manager */
    this.flowManager = store.getState([ 'bacnet', 'flowManager' ]);
    /* Create and init BACnet Service Manager */
    this.serviceManager = store.getState([ 'bacnet', 'serviceManager' ]);
    // Creates instance of the API Service
    this.apiService = this.serviceManager.createAPIService(this.logger);
};

/**
 * Inits the BACnet object properties.
 *
 * @return {Promise<void>}
 */
BinaryLight.prototype.initProperties = function () {

    // Gets the 'presentValue|statusFlags' property
    this.sendSubscribeCOV(this.objectId);
};

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
BinaryLight.prototype.subscribeToProperty = function () {
    var _this = this;
    // Handle 'Present Value' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
            .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)))
            .subscribe(function (resp) {
            var bacnetProperties = _this
                .getCOVNotificationValues(resp);
            _this.state.lightActive = bacnetProperties.presentValue.value === 1;
            _this.logger.logDebug("BinaryLightActorDevice - subscribeToProperty: "
                + ("presentValue " + JSON.stringify(_this.state.lightActive)));
            _this.logger.logDebug("BinaryLightActorDevice - subscribeToProperty: "
                + ("State " + JSON.stringify(_this.state)));
            _this.publishStateChange();
        }, function (error) {
            _this.logger.logDebug("BinaryLightActorDevice - subscribeToProperty: "
                + ("Binary Light Actor COV notification was not received " + error));
            _this.publishStateChange();
        });
        // Read Property Flow
        var readPropertyFlow = this.flowManager.getResponseFlow()
            .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)));
        // Gets the 'presentValue' property
        this.subManager.subscribe = readPropertyFlow
            .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
            .subscribe(function (resp) {
            var bacnetProperty = BACnet.Helpers.Layer
                .getPropertyValue(resp.layer);
            _this.state.lightActive = bacnetProperty.value === 1;
            _this.logger.logDebug("BinaryLightActorDevice - subscribeToProperty: "
                + ("Object Present Value retrieved: " + _this.state.lightActive));
            _this.publishStateChange();
        });
};

/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
BinaryLight.prototype.getCOVNotificationValues = function (resp) {
    this.logger.logDebug("getCOVNotificationValues: "
        + "Received notification");
    var respServiceData = _.get(resp, 'layer.apdu.service', null);
    // Get list of properties
    var covProps = respServiceData.listOfValues;
    // Get instances of properties
    var presentValueProp = BACnet.Helpers.Layer.findPropById(covProps, BACnet.Enums.PropertyId.presentValue);
    var statusFlagsProp = BACnet.Helpers.Layer.findPropById(covProps, BACnet.Enums.PropertyId.statusFlags);
    // Get instances of property values
    var presentValue = presentValueProp.values[0];
    var statusFlags = statusFlagsProp.values[0];
    return { presentValue: presentValue, statusFlags: statusFlags };
};

/**
 * Sends the 'WriteProperty' confirmed request.
 *
 * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
 * @param  {BACnet.Enums.PropertyId} propId - BACnet property identifier
 * @param  {BACnet.Types.BACnetTypeBase[]} values - BACnet property values
 * @return {void}
 */
BinaryLight.prototype.sendWriteProperty = function (objectId, propId, values) {
    this.apiService.confirmedReq.writeProperty({
        invokeId: 1,
        objId: objectId,
        prop: {
            id: new BACnet.Types
                .BACnetEnumerated(propId),
            values: values,
        },
    });
};

/**
 * Sends the 'ReadProperty' confirmed request.
 *
 * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
 * @param  {BACnet.Enums.PropertyId} propId - BACnet property identifier
 * @return {void}
 */
BinaryLight.prototype.sendReadProperty = function (objectId, propId) {
    this.apiService.confirmedReq.readProperty({
        invokeId: 1,
        objId: objectId,
        prop: {
            id: new BACnet.Types.BACnetEnumerated(propId),
        },
    });
};

/**
 * Sends the 'SubscribeCOV' confirmed request.
 *
 * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
 * @return {void}
 */
BinaryLight.prototype.sendSubscribeCOV = function (objectId) {

    this.subManager.subscribe = store.select(['bacnet', 'covTimer'])
        .subscribe((function (covTimer) {
            this.apiService.confirmedReq.subscribeCOV({
                invokeId: 1,
                objId: objectId,
                subProcessId: new BACnet.Types
                    .BACnetUnsignedInteger(0),
                issConfNotif: new BACnet.Types
                    .BACnetBoolean(!!BACnet.Enums.COVNotificationType.Unconfirmed),
                lifetime: new BACnet.Types
                    .BACnetUnsignedInteger(covTimer.config.lifetime),
            });
        }).bind(this));
    this.covObjectIds.push(objectId);
};

BinaryLight.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
BinaryLight.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
};

BinaryLight.prototype.createLogger = function () {
    var logger = new Logger(this);
    logger.setLogMethod(Enums.LogLevel.Debug, this.logDebug);
    logger.setLogMethod(Enums.LogLevel.Error, this.logError);
    logger.setLogMethod(Enums.LogLevel.Info, this.logInfo);
    return logger;
};

/**
 * Sends the 'writeProperty' request to set the value of the 'presentValue' property.
 *
 * @param  {number} presentValue - value of the 'presentValue' property.
 * @return {Bluebird<void>}
 */
BinaryLight.prototype.setLightActive = function (targetState) {
    this.logger.logDebug('BinaryLightActorDevice - setLightActive: Called setLightActive()');
    this.sendWriteProperty(this.objectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetEnumerated(+targetState)]);
    return Bluebird.resolve();
};

/**
 * TID API Methods
 */
/**
 * Sends the 'readProperty' request to get the value of the 'presentValue' property.
 *
 * @return {Bluebird<void>}
 */
BinaryLight.prototype.update = function () {
    this.logger.logDebug('BinaryLightActorDevice - update: Called update()');

    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.presentValue);

    return Bluebird.resolve();
};

/**
 * Switches the value of the 'presentValue' property.
 *
 * @return {Bluebird<void>}
 */
BinaryLight.prototype.toggle = function () {
    this.logger.logDebug('BinaryLightActorDevice - toggle: Called toggle()');

    if (this.state.lightActive) {
        this.off();
    } else {
        this.on();
    }

    return Bluebird.resolve();
};

/**
 * Sets '1' (true) value of the 'presentValue' property.
 *
 * @return {Bluebird<void>}
 */
BinaryLight.prototype.on = function () {
    this.logger.logDebug('BinaryLightActorDevice - on: Called on()');

    this.setLightActive(true);
    return Bluebird.resolve();
};

/**
 * Sets '0' (false) value of the 'presentValue' property.
 *
 * @return {Bluebird<void>}
 */
BinaryLight.prototype.off = function () {
    this.logger.logDebug('BinaryLightActorDevice - off: Called off()');

    this.setLightActive(false);
    return Bluebird.resolve();
};