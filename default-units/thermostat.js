module.exports = {
    metadata: {
        plugin: "thermostat",
        label: "BACnet Thermostat",
        role: "actor",
        family: "thermostat",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [
            {
                id: 'incrementSetpoint',
                label: 'Increment Setpoint',
            },
            {
                id: 'decrementSetpoint',
                label: 'Decrement Setpoint',
            },
        ],
        state: [
            {
                id: 'initialized', label: 'Initialized',
                type: {
                    id: 'boolean',
                },
            }, {
                id: "setpoint", label: "Setpoint",
                type: {
                    id: "decimal"
                }
            }, {
                id: "temperature", label: "Temperature",
                type: {
                    id: "decimal"
                }
            }, {
                id: 'mode',
                label: 'Mode',
                type: {
                    id: 'string',
                },
            }, {
                id: 'heatActive',
                label: 'Heat Active',
                type: {
                    id: 'boolean',
                },
            }, {
                id: 'coolActive',
                label: 'Cool Active',
                type: {
                    id: 'boolean',
                },
            },
        ],
        configuration: [
            {
                label: "Setpoint Feedback Object Id",
                id: "setpointFeedbackObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Setpoint Feedback Object Type",
                id: "setpointFeedbackObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Temperature Object Id",
                id: "temperatureObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Temperature Object Type",
                id: "temperatureObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Setpoint Modification Object Id",
                id: "setpointModificationObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Setpoint Modification Object Type",
                id: "setpointModificationObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: 'Mode Object Id',
                id: 'modeObjectId',
                type: {
                    id: 'integer',
                },
                defaultValue: '',
            }, {
                label: 'Mode Object Type',
                id: 'modeObjectType',
                type: {
                    id: 'string',
                },
                defaultValue: '',
            },
        ]
    },
    create: function () {
        return new Thermostat();
    },

    discovery: function () {
        return new ThermostatDiscovery();
    },
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
function Thermostat() { 
}

function ThermostatDiscovery() {   
}

ThermostatDiscovery.prototype.start = function () {
}

ThermostatDiscovery.prototype.stop = function () {
}
/**
 *
 */
Thermostat.prototype.className = 'ThermostatActorDevice';

Thermostat.prototype.start = function () {
    // Init the default state
    this.setState(this.state);

    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
Thermostat.prototype.stop = function () {
    this.isDestroyed = true;

    // Sends the `unsubscribeCOV` request to the BACnet Device
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

Thermostat.prototype.initDevice = function () {
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
    this.logger.logDebug(`BACNetActor - initDevice: `
    + `Creates instances of the plugin componets`);
    this.createPluginComponents();

    // Creates `subscribtion` to the BACnet object properties
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
Thermostat.prototype.initSubManager = function () {

    this.covObjectIds = [];
    this.subManager = new Managers.SubscriptionManager();
    return Bluebird.resolve(this.subManager.initManager());
}

/**
 * Creates and inits params of the BACnet Analog Input from plugin configuration.
 * Steps:
 * - creates and inits `objectId`.
 *
 * @return {void}
 */
Thermostat.prototype.initParamsFromConfig = function () {
    this.setpointFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.setpointFeedbackObjectId,
        this.config.setpointFeedbackObjectType,
    );

    this.temperatureObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.temperatureObjectId,
        this.config.temperatureObjectType,
    );

    this.setpointModificationObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.setpointModificationObjectId,
        this.config.setpointModificationObjectType,
    );

    this.modeObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.modeObjectId,
        this.config.modeObjectType,
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
Thermostat.prototype.createPluginComponents = function () {
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
Thermostat.prototype.initProperties = function () {

   // Gets the `presentValue|statusFlags` property for `setpoint`
   this.sendSubscribeCOV(this.setpointFeedbackObjectId);

   // Gets the `presentValue|statusFlags` property for `temperature`
   this.sendSubscribeCOV(this.temperatureObjectId);

   this.sendReadProperty(this.modeObjectId, BACnet.Enums.PropertyId.stateText);
};

/**
 * Creates `subscribtion` to the BACnet object properties.
 *
 * @return {void}
 */
Thermostat.prototype.subscribeToProperty = function () {
    var _this = this;
    // Handle COV Notifications Flow. Sets the `mode`, `heatActive`, `coolActive`
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.modeObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        var modeStateIndex = bacnetProperties.presentValue.value - 1;
        _this.state.mode = _this.stateText[modeStateIndex];
        switch (_this.state.mode) {
            case Enums.ThermostatMode.Heat:
                _this.state.heatActive = true;
                _this.state.coolActive = false;
                break;
            case Enums.ThermostatMode.Cool:
                _this.state.heatActive = false;
                _this.state.coolActive = true;
                break;
            default:
                _this.state.heatActive = false;
                _this.state.coolActive = false;
                break;
        }
        _this.logger.logDebug("ThermostatActorDevice - subscribeToProperty: "
            + ("Mode " + JSON.stringify(_this.state.mode)));
        _this.logger.logDebug("ThermostatActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("ThermostatActorDevice - subscribeToProperty: "
            + ("Mode COV notification was not received " + error));
        _this.publishStateChange();
    });
    // Read Property Flow
    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)));
    // Gets the `stateText` property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.modeObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.stateText)))
        .subscribe(function (resp) {
        var respServiceData = _.get(resp, 'layer.apdu.service', null);
        var stateText = respServiceData.prop.values;
        _this.stateText = _.map(stateText, function (valueStateText) {
            return valueStateText.value;
        });
        _this.logger.logDebug("ThermostatActorDevice - subscribeToProperty: "
            + ("State Text: " + JSON.stringify(_this.stateText)));
        _this.publishStateChange();
        // Gets the `presentValue|statusFlags` property
        _this.sendSubscribeCOV(_this.modeObjectId);
    });
};

/**
 * Extracts the `presentValue` and `statusFlags` of the BACnet Object from
 * the BACnet `COVNotification` service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
Thermostat.prototype.getCOVNotificationValues = function (resp) {
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
 * Sends the `WriteProperty` confirmed request.
 *
 * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
 * @param  {BACnet.Enums.PropertyId} propId - BACnet property identifier
 * @param  {BACnet.Types.BACnetTypeBase[]} values - BACnet property values
 * @return {void}
 */
Thermostat.prototype.sendWriteProperty = function (objectId, propId, values) {
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
 * Sends the `ReadProperty` confirmed request.
 *
 * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
 * @param  {BACnet.Enums.PropertyId} propId - BACnet property identifier
 * @return {void}
 */
Thermostat.prototype.sendReadProperty = function (objectId, propId) {
    this.apiService.confirmedReq.readProperty({
        invokeId: 1,
        objId: objectId,
        prop: {
            id: new BACnet.Types.BACnetEnumerated(propId),
        },
    });
};

/**
 * Sends the `SubscribeCOV` confirmed request.
 *
 * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
 * @return {void}
 */
Thermostat.prototype.sendSubscribeCOV = function (objectId) {

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

Thermostat.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
Thermostat.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
};

Thermostat.prototype.createLogger = function () {
    var logger = new Logger(this);
    logger.setLogMethod(Enums.LogLevel.Debug, this.logDebug);
    logger.setLogMethod(Enums.LogLevel.Error, this.logError);
    logger.setLogMethod(Enums.LogLevel.Info, this.logInfo);
    return logger;
};

/**
 * Sends the `writeProperty` request to set the setpoint of the `presentValue` property.
 *
 * @return {Promise<void>}
 */
Thermostat.prototype.setSetpointModification = function (setpointModifier) {
    this.logger.logDebug('Thermostat - setSetpointModification: '
        + ("Setting setpoint modification: " + setpointModifier));
    // Gets the `presentValue|statusFlags` property for `setpoint`
    this.sendWriteProperty(this.setpointModificationObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetReal(setpointModifier)]);
    return Bluebird.resolve();
};

/**
 * TID API Methods
 */
/**
 * Sends the `readProperty` requests to get the values (temperature, setpoint)
 * of the `presentValue` property.
 *
 * @return {Bluebird<void>}
 */
Thermostat.prototype.update = function () {
    this.logger.logDebug('Thermostat - update: '
        + "Called update()");
    this.sendReadProperty(this.setpointFeedbackObjectId, BACnet.Enums.PropertyId.presentValue);
    this.sendReadProperty(this.temperatureObjectId, BACnet.Enums.PropertyId.presentValue);
    return Bluebird.resolve();
};
/**
 * Increments the `setpoint` value.
 *
 * @return {Bluebird<void>}
 */
Thermostat.prototype.incrementSetpoint = function () {
    this.logger.logDebug('Thermostat - incrementSetpoint: '
        + "Increments the setpoint value...");
    return this.setSetpointModification(1);
};
/**
 * Decrements the `setpoint` value.
 *
 * @return {Bluebird<void>}
 */
Thermostat.prototype.decrementSetpoint = function () {
    this.logger.logDebug('Thermostat - decrementSetpoint: '
        + "Decrements the setpoint value...");
    return this.setSetpointModification(-1);
};