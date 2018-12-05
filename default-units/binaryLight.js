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
            }, {
                label: 'Status Checks Interval',
                id: 'statusChecksInterval',
                type: {
                    id: 'integer',
                },
                defaultValue: 60,
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
var Rx = require("rxjs");
var RxOp = require("rxjs/operators");
var store = require("../lib/redux").store;
/* Plugin devices */
var APIError = require("../lib/errors").APIError;
var Managers = require("../lib/managers");
var Helpers = require("../lib/helpers");
var BACnet = require("tid-bacnet-logic");
var Logger = require("../lib/utils").Logger;
var Enums = require("../lib/enums");
var Entities = require("../lib/entities");
var StatusTimerConfig = require("../lib/configs/status-timer.config");

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
    if (this.statusChecksTimer) {
        this.statusChecksTimer.cancel();
        this.statusChecksTimer = null;
    }
};

BinaryLight.prototype.initDevice = function (deviceId) {
    // Init the default state
    this.setState(this.state);

    this.operationalState = {};

    this.propsReceived = false;

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
    // Creates the 'presentValue|statusFlags' property subscription
    this.subscribeToCOV()
    this.sendSubscribeCOV(this.objectId);

    // Init status checks timer if polling time is provided
    if (this.statusChecksTimer.config.interval !== 0) {
        this.statusChecksTimer.start(function(interval) {
            this.subscribeToStatusCheck(interval);
            this.logger.logDebug("BinaryLightActorDevice - statusCheck: sending request" );
            this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.statusFlags);
        }.bind(this));
        this.operationalState = {
            status: Enums.OperationalStatus.Pending,
            message: "Waiting for Status Flags..."
        };
        this.logger.logDebug("BinaryLightActorDevice - operationalState: " + JSON.stringify(this.operationalState));
        this.publishOperationalStateChange();
    } else {
        // Inits the BACnet object properties
        this.initProperties();
    }

    this.state.initialized = true;
    this.publishStateChange();
}

/**
 * preInit -  creates actor subscription manager and
 * covObjectIds array.
 *
 * @return {Promise<any>}
 */
BinaryLight.prototype.preInit = function () {

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
        this.config.lightActiveObjectType
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
BinaryLight.prototype.createPluginComponents = function () {
    /* Create and init BACnet Flow Manager */
    this.flowManager = store.getState([ 'bacnet', this.deviceId, 'flowManager' ]);
    /* Create and init BACnet Service Manager */
    this.serviceManager = store.getState([ 'bacnet', this.deviceId, 'serviceManager' ]);
    // Creates instance of the API Service
    this.apiService = this.serviceManager.createAPIService(this.logger);
    /* Create Status Checks Timer*/
    var interval = _.isNil(this.config.statusChecksInterval) ?
        undefined : this.config.statusChecksInterval * 1000;
    var statusTimerConfig = _.merge({}, StatusTimerConfig, {
        interval: interval
    });
    this.statusChecksTimer = new Entities.StatusTimer(statusTimerConfig);
};

/**
 * Inits the BACnet object properties.
 *
 * @return {Promise<void>}
 */
BinaryLight.prototype.initProperties = function () {

    // Gets the 'presentValue|statusFlags' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.presentValue);
};


/**
 * Maps status flags to operational state if they are presented.
 * @param {BACnet.Types.StatusFlags} statusFlags - parsed 'statusFlags' property of the actor
 *
 * @return {void}
 */
BinaryLight.prototype.handleStausFlags = function (statusFlags) {
    this.state.outOfService = statusFlags.value.outOfService;
    this.state.alarmValue = statusFlags.value.inAlarm;
    if (statusFlags.value.inAlarm) {
        this.logger.logError("BinaryLightActorDevice - statusCheck: " +
            "Actor alarm detected!");
        this.operationalState = {
            status: Enums.OperationalStatus.Error,
            message: "Alarm detected"
        };
    }
    if (statusFlags.value.outOfService) {
        this.logger.logError("BinaryLightActorDevice - statusCheck: " +
            "Physical device is out of service!");
        this.operationalState = {
            status: Enums.OperationalStatus.Error,
            message: "Out of service"
        };
    }
    if (statusFlags.value.fault) {
        this.logger.logError("BinaryLightActorDevice - statusCheck: " +
            "Fault detected!");
        this.operationalState = {
            status: Enums.OperationalStatus.Error,
            message: "Fault detected"
        };
    }

}

/**
 * Creates 'subscribtion' to the BACnet object status flags.
 * @param {number} interval - the lifetime of the 'subscription'
 *
 * @return {void}
 */
BinaryLight.prototype.subscribeToStatusCheck = function (interval) {
    var _this = this;
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
            RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.objectId)),
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.statusFlags)),
            RxOp.timeout(interval),
            RxOp.first())
        .subscribe(function (resp) {
            _this.logger.logDebug("BinaryLightActorDevice - statusCheck successful");
            _this.statusChecksTimer.reportSuccessfulCheck();
            _this.operationalState = {
                status: Enums.OperationalStatus.Ok,
                message: "Status check successful"
            };
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags);
            _this.logger.logDebug("BinaryLightActorDevice - statusCheck: " +
                ("State " + JSON.stringify(_this.state)));           
            if (!_this.propsReceived && _this.operationalState.status !== Enums.OperationalStatus.Error) {
                _this.operationalState = {
                    status: Enums.OperationalStatus.Pending,
                    message: 'Status check successful. Receiving properties...'
                };
                // Inits the BACnet object properties
                _this.initProperties();
            }
            _this.logger.logDebug("BinaryLightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
            _this.publishOperationalStateChange();

        }, function (error) {
            _this.logger.logDebug("BinaryLightActorDevice - status check failed: " + error);
            _this.operationalState = {
                status: Enums.OperationalStatus.Error,
                message: "Status check failed - device unreachable"
            };
            _this.logger.logDebug("BinaryLightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
            _this.publishOperationalStateChange();
        });

};

/**
 * Creates 'subscribtion' to the BACnet COV notifications.
 *
 * @return {void}
 */
BinaryLight.prototype.subscribeToCOV = function () {
    var _this = this;
    // Handle 'Present Value' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)))
        .subscribe(function (resp) {
            var bacnetProperties = _this
                .getCOVNotificationValues(resp);
            _this.state.lightActive = bacnetProperties.presentValue.value === 1;
            _this.operationalState = {
                status: Enums.OperationalStatus.Ok,
                message: "Received COV Notification"
            };
            _this.handleStausFlags(bacnetProperties.statusFlags);
            _this.logger.logDebug("BinaryLightActorDevice - subscribeToCOV: "
                + ("presentValue " + JSON.stringify(_this.state.lightActive)));
            _this.logger.logDebug("BinaryLightActorDevice - subscribeToCOV: "
                + ("State " + JSON.stringify(_this.state)));
            if (_this.statusChecksTimer.started) {
                _this.statusChecksTimer.reportSuccessfulCheck();
                _this.statusChecksTimer.reset();
            }
            _this.logger.logDebug("BinaryLightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
            _this.publishOperationalStateChange();
            _this.publishStateChange();
        }, function (error) {
            _this.logger.logDebug("BinaryLightActorDevice - subscribeToCOV: "
                + ("BinaryLight COV notification was not received " + error));
            _this.publishStateChange();
        });
}

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
BinaryLight.prototype.subscribeToProperty = function () {
    var _this = this;
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
        _this.propsReceived = true;
        _this.operationalState = {
            status: Enums.OperationalStatus.Ok,
            message: 'Actor\'s properties successfully initialized'
        };
        _this.logger.logDebug("BinaryLightActorDevice - subscribeToProperty: "
            + "actor's properties were received");
        _this.logger.logDebug("BinaryLightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        _this.publishOperationalStateChange();
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
 * @param  {boolean} targetState - value of the 'presentValue' property.
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