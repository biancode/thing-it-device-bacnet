module.exports = {
    metadata: {
        plugin: "roomControl",
        label: "BACnet Room Control",
        role: "actor",
        family: "roomControl",
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
            }
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
            }
        ]
    },
    create: function () {
        return new RoomControl();
    },

    discovery: function () {
        return new RoomControlDiscovery();
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
function RoomControl() { 
}

function RoomControlDiscovery() {   
}

RoomControlDiscovery.prototype.start = function () {
}

RoomControlDiscovery.prototype.stop = function () {
}
/**
 *
 */
RoomControl.prototype.className = 'RoomControlActorDevice';

RoomControl.prototype.start = function () {
    // Init the default state
    this.setState(this.state);

    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
RoomControl.prototype.stop = function () {
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

RoomControl.prototype.initDevice = function () {
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
RoomControl.prototype.initSubManager = function () {

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
RoomControl.prototype.initParamsFromConfig = function () {
    this.setpointFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.setpointFeedbackObjectId,
        this.config.setpointFeedbackObjectType
    );

    this.temperatureObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.temperatureObjectId,
        this.config.temperatureObjectType
    );

    this.setpointModificationObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.setpointModificationObjectId,
        this.config.setpointModificationObjectType
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
RoomControl.prototype.createPluginComponents = function () {
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
RoomControl.prototype.initProperties = function () {

   // Gets the 'presentValue|statusFlags' property for 'setpoint'
   this.sendSubscribeCOV(this.setpointFeedbackObjectId);

   // Gets the 'presentValue|statusFlags' property for 'temperature'
   this.sendSubscribeCOV(this.temperatureObjectId);
};

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
RoomControl.prototype.subscribeToProperty = function () {
    var _this = this;
    // Handle 'Setpoint' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.setpointFeedbackObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.setpoint = bacnetProperties.presentValue.value;
        _this.logger.logDebug("RoomControlActorDevice - subscribeToProperty: "
            + ("Setpoint " + JSON.stringify(_this.state.setpoint)));
        _this.logger.logDebug("RoomControlActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("RoomControlActorDevice - subscribeToProperty: "
            + ("Setpoint COV notification was not received " + error));
        _this.publishStateChange();
    });
    // handle 'Temperature' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.temperatureObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.temperature = bacnetProperties.presentValue.value;
        _this.logger.logDebug("RoomControlActorDevice - subscribeToProperty: "
            + ("Temperature " + JSON.stringify(_this.state.temperature)));
        _this.logger.logDebug("RoomControlActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("RoomControlActorDevice - subscribeToProperty: "
            + ("Temperature COV notification was not received " + error));
        _this.publishStateChange();
    });
    // Read Property Flow
    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)));
    // Gets the 'presentValue' (setpoint) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.setpointFeedbackObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.setpoint = bacnetProperty.value;
        _this.logger.logDebug("RoomControlActorDevice - subscribeToProperty: "
            + ("Setpoint: " + _this.state.setpoint));
        _this.publishStateChange();
    });
    // Gets the 'presentValue' (temperature) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.temperatureObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.temperature = bacnetProperty.value;
        _this.logger.logDebug("RoomControlActorDevice - subscribeToProperty: "
            + ("Temperature: " + _this.state.setpoint));
        _this.publishStateChange();
    });
};

/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
RoomControl.prototype.getCOVNotificationValues = function (resp) {
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
RoomControl.prototype.sendWriteProperty = function (objectId, propId, values) {
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
RoomControl.prototype.sendReadProperty = function (objectId, propId) {
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
RoomControl.prototype.sendSubscribeCOV = function (objectId) {

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

RoomControl.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
RoomControl.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
};

RoomControl.prototype.createLogger = function () {
    var logger = new Logger(this);
    logger.setLogMethod(Enums.LogLevel.Debug, this.logDebug);
    logger.setLogMethod(Enums.LogLevel.Error, this.logError);
    logger.setLogMethod(Enums.LogLevel.Info, this.logInfo);
    return logger;
};

/**
 * Sends the 'writeProperty' request to set the setpoint of the 'presentValue' property.
 *
 * @return {Promise<void>}
 */
RoomControl.prototype.setSetpointModification = function (setpointModifier) {
    this.logger.logDebug('RoomControl - setSetpointModification: '
        + ("Setting setpoint modification: " + setpointModifier));
    // Gets the 'presentValue|statusFlags' property for 'setpoint'
    this.sendWriteProperty(this.setpointModificationObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetReal(setpointModifier)]);
    return Bluebird.resolve();
};

/**
 * TID API Methods
 */
/**
 * Sends the 'readProperty' requests to get the values (temperature, setpoint)
 * of the 'presentValue' property.
 *
 * @return {Bluebird<void>}
 */
RoomControl.prototype.update = function () {
    this.logger.logDebug('RoomControl - update: '
        + "Called update()");
    this.sendReadProperty(this.setpointFeedbackObjectId, BACnet.Enums.PropertyId.presentValue);
    this.sendReadProperty(this.temperatureObjectId, BACnet.Enums.PropertyId.presentValue);
    return Bluebird.resolve();
};
/**
 * Increments the 'setpoint' value.
 *
 * @return {Bluebird<void>}
 */
RoomControl.prototype.incrementSetpoint = function () {
    this.logger.logDebug('RoomControl - incrementSetpoint: '
        + "Increments the setpoint value...");
    return this.setSetpointModification(1);
};
/**
 * Decrements the 'setpoint' value.
 *
 * @return {Bluebird<void>}
 */
RoomControl.prototype.decrementSetpoint = function () {
    this.logger.logDebug('RoomControl - decrementSetpoint: '
        + "Decrements the setpoint value...");
    return this.setSetpointModification(-1);
};