"use strict";
module.exports = {
    metadata: {
        plugin: "analogInput",
        label: "BacNet Analog Input",
        role: "actor",
        family: "analogInput",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [
            {
                id: "update",
                label: "Update"
            }, 
            /**
             * @deprecated
             */
            {
                id: "changeValue",
                label: "changeValue"
            }
        ],

        state: [
            {
                id: 'initialized', label: 'Initialized',
                type: {
                    id: 'boolean',
                },
            }, {
                id: "presentValue", label: "Present Value",
                type: {
                    id: "decimal"
                }
            }, {
                id: "alarmValue", label: "Alarm Value",
                type: {
                    id: "boolean"
                }
            }, {
                id: "outOfService", label: "Out of Service",
                type: {
                    id: "boolean"
                }
            }, {
                id: "min", label: "Min",
                type: {
                    id: "float"
                }
            }, {
                id: "max", label: "Max",
                type: {
                    id: "float"
                }
            }, {
                label: 'Object Name',
                id: 'objectName',
                type: {
                    id: 'string',
                },
                defaultValue: 'AnalogInput',
            },
            {
                label: 'Description',
                id: 'description',
                type: {
                    id: 'string',
                },
                defaultValue: '',
            },
            {
                label: 'Unit',
                id: 'unit',
                type: {
                    id: 'string',
                },
                defaultValue: '',
            },

        ],
        configuration: [
            {
                label: "Object Identifier",
                id: "objectId",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            {
                label: "Object Type",
                id: "objectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            /**
             * @deprecated
             */
            {
                label: 'Object Name',
                id: 'objectName',
                type: {
                    id: 'string',
                },
                defaultValue: 'AnalogInput',
            },
            /**
             * @deprecated
             */
            {
                label: 'Description',
                id: 'description',
                type: {
                    id: 'string',
                },
                defaultValue: '',
            },
            /**
             * @deprecated
             */
            {
                label: 'Unit',
                id: 'unit',
                type: {
                    id: 'string',
                },
                defaultValue: '',
            },
        ]
    },
    create: function () {
        "use strict";
        return new AnalogInput();
    },

    discovery: function () {
        "use strict";
        return new AnalogInputDiscovery();
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
function AnalogInput() { 
}

function AnalogInputDiscovery() {   
}

AnalogInputDiscovery.prototype.start = function () {
}

AnalogInputDiscovery.prototype.stop = function () {
}
/**
 *
 */
AnalogInput.prototype.className = 'AnalogInputActorDevice';

AnalogInput.prototype.start = function () {
    // Init the default state
    this.setState(this.state);

    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
AnalogInput.prototype.stop = function () {
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

AnalogInput.prototype.initDevice = function (deviceId) {
    // Init the default state
    this.setState(this.state);

    this.state.initialized = false;

    this.config = this.configuration;
    
    this.deviceId = deviceId;

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
AnalogInput.prototype.initSubManager = function () {

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
AnalogInput.prototype.initParamsFromConfig = function () {
    this.objectId = Helpers.BACnet.getBACnetObjectId(
        this.config.objectId,
        this.config.objectType, 
        BACnet.Enums.ObjectType.AnalogInput
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
AnalogInput.prototype.createPluginComponents = function () {
    /* Create and init BACnet Flow Manager */
    this.flowManager = store.getState([ 'bacnet', this.deviceId, 'flowManager' ]);
    /* Create and init BACnet Service Manager */
    this.serviceManager = store.getState([ 'bacnet', this.deviceId, 'serviceManager' ]);
    // Creates instance of the API Service
    this.apiService = this.serviceManager.createAPIService(this.logger);
};

/**
 * Inits the BACnet object properties.
 *
 * @return {Promise<void>}
 */
AnalogInput.prototype.initProperties = function () {

    // Gets the 'maxPresValue' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.maxPresValue);
    // Gets the 'minPresValue' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.minPresValue);
    // Gets the 'objectName' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.objectName);
    // Gets the 'description' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.description);
    // Gets the 'units' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.units);
    // Gets the 'presentValue|statusFlags' property
    this.sendSubscribeCOV(this.objectId);
};

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
AnalogInput.prototype.subscribeToProperty = function () {
    var _this = this;
    // Handle 'Present Value' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.presentValue = bacnetProperties.presentValue.value;
        _this.state.outOfService = bacnetProperties.statusFlags.value.outOfService;
        _this.state.alarmValue = bacnetProperties.statusFlags.value.inAlarm;
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("presentValue " + JSON.stringify(_this.state.presentValue)));
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("Analog Input COV notification was not received " + error));
        _this.publishStateChange();
    });
    // Read Property Flow
    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)));
    // Gets the 'maxPresValue' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.maxPresValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.max = bacnetProperty.value;
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("Max value for 'Present Value' property retrieved: " + _this.state.max));
        _this.publishStateChange();
    });
    // Gets the 'minPresValue' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.minPresValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.min = bacnetProperty.value;
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("Min value for 'Present Value' property retrieved: " + _this.state.min));
        _this.publishStateChange();
    });
    // Gets the 'objectName' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.objectName)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.objectName = bacnetProperty.value;
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("Object Name retrieved: " + _this.state.objectName));
        _this.publishStateChange();
    });
    // Gets the 'description' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.description)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.description = bacnetProperty.value;
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("Object Description retrieved: " + _this.state.description));
        _this.publishStateChange();
    });
    // Gets the 'units' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.units)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        var unit = BACnet.Enums.EngineeringUnits[bacnetProperty.value];
        _this.state.unit = _.isNil(unit) ? 'none' : unit;
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("Object Unit retrieved: " + _this.state.unit));
        _this.publishStateChange();
    });
    // Gets the 'presentValue' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.presentValue = bacnetProperty.value;
        _this.logger.logDebug("AnalogInputActorDevice - subscribeToProperty: "
            + ("Object Present Value retrieved: " + _this.state.presentValue));
        _this.publishStateChange();
    });
};

/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
AnalogInput.prototype.getCOVNotificationValues = function (resp) {
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
AnalogInput.prototype.sendWriteProperty = function (objectId, propId, values) {
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
AnalogInput.prototype.sendReadProperty = function (objectId, propId) {
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
AnalogInput.prototype.sendSubscribeCOV = function (objectId) {

    this.subManager.subscribe = store.select(['bacnet', this.deviceId, 'covTimer'])
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

AnalogInput.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
AnalogInput.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
};

AnalogInput.prototype.createLogger = function () {
    var logger = new Logger(this);
    logger.setLogMethod(Enums.LogLevel.Debug, this.logDebug);
    logger.setLogMethod(Enums.LogLevel.Error, this.logError);
    logger.setLogMethod(Enums.LogLevel.Info, this.logInfo);
    return logger;
};

/**
 * TID API Methods
 */
/**
 * Sends the 'readProperty' request to get the value of the 'presentValue' property.
 *
 * @return {Bluebird<void>}
 */
AnalogInput.prototype.update = function () {
    this.logger.logDebug('Called update()');
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.presentValue);
    return Bluebird.resolve();
};


