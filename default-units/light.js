module.exports = {
    metadata: {
        plugin: "light",
        label: "BACnet Light Control",
        role: "actor",
        family: "light",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [
            {
                id: 'toggleLight',
                label: 'Toggle Light',
            },
            {
                id: 'changeDimmer',
                label: 'Change Dimmer',
            },
            {
                id: 'update',
                label: 'Update',
            },
        ],
        state: [
            {
                id: 'initialized', label: 'Initialized',
                type: {
                    id: 'boolean',
                },
            }, {
                id: "lightActive", label: "Light Active",
                type: {
                    id: "boolean"
                }
            }, {
                id: "dimmerLevel", label: "Dimmer Level",
                type: {
                    id: "decimal"
                }
            }, {
                id: 'lightState',
                label: 'Light State',
                type: {
                    id: 'string',
                },
            }
        ],
        configuration: [
            {
                label: "Level Feedback Object Id",
                id: "levelFeedbackObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Level Feedback Object Type",
                id: "levelFeedbackObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Level Modification Object Id",
                id: "levelModificationObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Level Modification Object Type",
                id: "levelModificationObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Light Active Feedback Object Id",
                id: "lightActiveFeedbackObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Light Active Feedback Object Type",
                id: "lightActiveFeedbackObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Light Active Modification Object Id",
                id: "lightActiveModificationObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Light Active Modification Object Type",
                id: "lightActiveModificationObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Light Active Modification Value On",
                id: "lightActiveModificationValueOn",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Light Active Modification Value Off",
                id: "lightActiveModificationValueOff",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }

        ]
    },
    create: function () {
        return new Light();
    },

    discovery: function () {
        return new LightDiscovery();
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
function Light() { 
}

function LightDiscovery() {   
}

LightDiscovery.prototype.start = function () {
}

LightDiscovery.prototype.stop = function () {
}
/**
 *
 */
Light.prototype.className = 'LightActorDevice';

Light.prototype.start = function () {
    // Init the default state
    this.setState(this.state);

    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
Light.prototype.stop = function () {
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

Light.prototype.initDevice = function () {
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
Light.prototype.initSubManager = function () {

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
Light.prototype.initParamsFromConfig = function () {
    this.levelFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.levelFeedbackObjectId,
        this.config.levelFeedbackObjectType
    );

    this.levelModificationObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.levelModificationObjectId,
        this.config.levelModificationObjectType
    );

    this.lightActiveFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.lightActiveFeedbackObjectId,
        this.config.lightActiveFeedbackObjectType
    );

    this.lightActiveModificationObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.lightActiveModificationObjectId,
        this.config.lightActiveModificationObjectType
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
Light.prototype.createPluginComponents = function () {
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
Light.prototype.initProperties = function () {

    // Gets the 'StateText' property for 'light state'
    this.sendReadProperty(this.lightActiveFeedbackObjectId, BACnet.Enums.PropertyId.stateText);

    // Gets the 'presentValue|statusFlags' property for 'dimmer level'
    this.sendSubscribeCOV(this.levelFeedbackObjectId);
};

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
Light.prototype.subscribeToProperty = function () {
    var _this = this;
    // Handle 'Dimmer Level' COVNotifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.levelFeedbackObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.dimmerLevel = bacnetProperties.presentValue.value;
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("Dimmer Level " + JSON.stringify(_this.state.dimmerLevel)));
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("Dimmer Level COV notification was not received " + error));
        _this.publishStateChange();
    });
    // Handle 'Light Active' COVNotifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.lightActiveFeedbackObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.setLightActive(bacnetProperties.presentValue);
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("Light Active " + JSON.stringify(_this.state.lightActive)));
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("Light Active COV notification was not received " + error));
        _this.publishStateChange();
    });
    // Read Property Flow
    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)));
    // Gets the 'stateText' (light states) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.lightActiveFeedbackObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.stateText)))
        .subscribe(function (resp) {
        var bacnetProperties = BACnet.Helpers.Layer
            .getPropertyValues(resp.layer);
        _this.stateText = _.map(bacnetProperties, function (stateTextItem) {
            return stateTextItem.value;
        });
        _this.publishStateChange();
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("Light States: " + JSON.stringify(_this.stateText)));
        _this.sendSubscribeCOV(_this.lightActiveFeedbackObjectId);
    });
    // Gets the 'presentValue' (light mode) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.lightActiveFeedbackObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.setLightActive(bacnetProperty);
        _this.publishStateChange();
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("Light Active: " + _this.state.lightActive));
    });
    // Gets the 'presentValue' (dimmer level) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.levelFeedbackObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.dimmerLevel = bacnetProperty.value;
        _this.publishStateChange();
        _this.logger.logDebug("LightActorDevice - subscribeToProperty: "
            + ("Dimmer Level: " + _this.state.dimmerLevel));
    });
};

/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
Light.prototype.getCOVNotificationValues = function (resp) {
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
Light.prototype.sendWriteProperty = function (objectId, propId, values) {
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
Light.prototype.sendReadProperty = function (objectId, propId) {
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
Light.prototype.sendSubscribeCOV = function (objectId) {

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

Light.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
Light.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
};

Light.prototype.createLogger = function () {
    var logger = new Logger(this);
    logger.setLogMethod(Enums.LogLevel.Debug, this.logDebug);
    logger.setLogMethod(Enums.LogLevel.Error, this.logError);
    logger.setLogMethod(Enums.LogLevel.Info, this.logInfo);
    return logger;
};

/**
 * Sends the 'writeProperty' request to set the Dimmer Level ('presentValue' property).
 *
 * @param  {number} dimmerLevel - dimmer level
 * @return {Bluebird<void>}
 */
Light.prototype.setDimmerLevelModification = function (dimmerLevel) {
    this.logger.logDebug('LightActorDevice - setDimmerLevelModification: '
        + ("Setting dimmer level modification " + dimmerLevel));
    this.sendWriteProperty(this.levelModificationObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetReal(dimmerLevel)]);
    return Bluebird.resolve();
};
/**
 * Sends the 'writeProperty' request to set the Light Mode ('presentValue' property).
 *
 * @param  {number} lightMode - light mode
 * @return {Bluebird<void>}
 */
Light.prototype.setLightActiveModification = function (lightMode) {
    this.logger.logDebug('LightActorDevice - setLightActiveModification: '
        + ("Setting dimmer level modification " + lightMode));
    this.sendWriteProperty(this.lightActiveModificationObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetUnsignedInteger(lightMode)]);
    return Bluebird.resolve();
};

/**
 * Sets the 'lightActive' state.
 *
 * @param  {BACnet.Types.BACnetUnsignedInteger} presentValue - BACnet present value
 * @return {void}
 */
Light.prototype.setLightActive = function (presentValue) {
    var lightStateIndex = presentValue.value - 1;
    var lightState = this.stateText[lightStateIndex];
    this.state.lightState = lightState;
    switch (this.state.lightState) {
        case 'ON':
            this.state.lightActive = true;
            break;
        case 'OFF':
            this.state.lightActive = false;
            break;
        default:
            this.state.lightActive = false;
            break;
    }
};

/**
 * TID API Methods
 */
/**
 * Sends the 'readProperty' request to get new 'presentValue' properties of the
 * Dimmer Level and Light Mode.
 *
 * @return {Bluebird<void>}
 */
Light.prototype.update = function () {
    this.logger.logDebug("LightActorDevice - update: Updating...");
    this.sendReadProperty(this.levelFeedbackObjectId, BACnet.Enums.PropertyId.presentValue);
    this.sendReadProperty(this.lightActiveFeedbackObjectId, BACnet.Enums.PropertyId.presentValue);
    return Bluebird.resolve();
};

/**
 * Toggles the light mode.
 *
 * @return {Bluebird<void>}
 */
Light.prototype.toggleLight = function () {
    var lightModification = this.state.lightActive
        ? this.configuration.lightActiveModificationValueOff
        : this.configuration.lightActiveModificationValueOn;
    this.logger.logDebug('LightActorDevice - toggleLight: '
        + ("Toggle light mode to the " + lightModification));
    this.setLightActiveModification(lightModification);
    return Bluebird.resolve();
};
/**
 * Changes the Dimmer Level.
 *
 * @param {{value:number}} param - light params
 * @return {Bluebird<void>}
 */
Light.prototype.changeDimmer = function (param) {
    var paramValue = _.get(param, 'value', null);
    this.logger.logDebug('LightActorDevice - changeDimmer: '
        + ("Dimmer Level: " + paramValue));
    if (!_.isNil(paramValue)) {
        throw new Errors.APIError('LightActorDevice - changeDimmer: No value provided to change!');
    }
    this.setDimmerLevelModification(paramValue);
    return Bluebird.resolve();
};