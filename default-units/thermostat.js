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
        return new Thermostat();
    },

    discovery: function () {
        return new ThermostatDiscovery();
    },
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

Thermostat.prototype.initDevice = function (deviceId) {
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
    // Subscribes to COV Notifications messages flows for 'setpoint', 'temperature' and 'mode'
    this.subscribeToCOV()
    // Inits COV subscriptions
    this.initCOVSubscriptions();

    // Init status checks timer if polling time is provided
    if (this.statusChecksTimer.config.interval !== 0) {
        this.statusChecksTimer.start(function(interval) {
            this.subscribeToStatusCheck(interval);
            this.logger.logDebug("ThermostatActorDevice - statusCheck: sending request" );
            this.sendReadProperty(this.setpointFeedbackObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.setpointModificationObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.temperatureObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.modeObjectId, BACnet.Enums.PropertyId.statusFlags);
        }.bind(this));
        this.operationalState = {
            status: Enums.OperationalStatus.Pending,
            message: "Waiting for Status Flags..."
        };
        this.logger.logDebug("ThermostatActorDevice - operationalState: " + JSON.stringify(this.operationalState));
        this.publishOperationalStateChange();
    } else {
        // Inits the BACnet object properties
        this.initProperties();
    }

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
 * - creates and inits 'objectId'.
 *
 * @return {void}
 */
Thermostat.prototype.initParamsFromConfig = function () {
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

    this.modeObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.modeObjectId,
        this.config.modeObjectType
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
Thermostat.prototype.createPluginComponents = function () {
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
Thermostat.prototype.initProperties = function () {

   this.sendReadProperty(this.modeObjectId, BACnet.Enums.PropertyId.stateText);
};

/**
 *  Sends 'subscribeCOV' for the BACnet objects.
 *
 * @return {Promise<void>}
 */
Thermostat.prototype.initCOVSubscriptions = function () {

    // Creates the 'presentValue|statusFlags' property subscription for 'setpoint'
    this.sendSubscribeCOV(this.setpointFeedbackObjectId);

    // Creates the 'presentValue|statusFlags' property subscription for 'temperature'
    this.sendSubscribeCOV(this.temperatureObjectId);

    // For 'mode', we need to receive mode actor's 'stateText' array, and only then subscribe to 'mode' notifications
 };

/**
 * Maps status flags to operational state if they are presented.
 * @param {BACnet.Types.StatusFlags} statusFlags - parsed 'statusFlags' property of the actor
 *
 * @return {void}
 */
Thermostat.prototype.handleStausFlags = function (statusFlags, object) {
    var message = _.isArray(this.operationalState.message) ?
        _.concat(this.operationalState.message, (object + ": status check successful")) 
        : [object + ": status check successful"];
    if (statusFlags.value.inAlarm) {
        this.logger.logError("ThermostatActorDevice - " + object + " - statusCheck: Alarm detected!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Alarm detected")) 
            : [object + ": Alarm detected"];
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    if (statusFlags.value.outOfService) {
        this.logger.logError("ThermostatActorDevice - " + object + " - statusCheck: Physical device is out of service!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Out of service"))
            : [object + ": Out of service"];          
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    if (statusFlags.value.fault) {
        this.logger.logError("ThermostatActorDevice - " + object + " - statusCheck: Fault detected!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Fault detected"))
            : [object + ": Fault detected"]; 
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    this.operationalState.message = message;
};

/**
 * Creates 'subscribtion' to the BACnet object status flags.
 * @param {number} interval - the lifetime of the 'subscription'
 *
 * @return {void}
 */
Thermostat.prototype.subscribeToStatusCheck = function (interval) {
    var _this = this;
    var statusFlagsFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
            RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.statusFlags)));
    // Handle 'setpointFeedbackObject' status flags
    var ovSetFeedbackFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.setpointFeedbackObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovSetFeedbackFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'setpointFeedbackObject');
            _this.logger.logDebug("ThermostatActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'setpointModificationObject' status flags
    var ovSetModFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.setpointModificationObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovSetModFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'setpointModificationObject');
            _this.logger.logDebug("ThermostatActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'temperatureObject' status flags
    var ovTempFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.temperatureObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovTempFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'temperatureObject');
            _this.logger.logDebug("ThermostatActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'modeObject' status flags
    var ovModeFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.modeObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovModeFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'modeObject');
            _this.logger.logDebug("ThermostatActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    this.subManager.subscribe = Rx.combineLatest(ovSetFeedbackFlags, ovSetModFlags, ovTempFlags, ovModeFlags)
        .pipe(RxOp.timeout(interval))
        .subscribe(function() {
            _this.logger.logDebug("ThermostatActorDevice - statusCheck: received status messages from all objects");
            _this.statusChecksTimer.reportSuccessfulCheck();
            if (_this.operationalState.status === Enums.OperationalStatus.Error) {
                _this.operationalState.message = _this.operationalState.message.join(', ')
            } else {
                _this.operationalState = {
                    status: Enums.OperationalStatus.Ok,
                    message: "Status check successful"
                }
            }
            _this.logger.logDebug("ThermostatActorDevice - statusCheck: " +
                ("State " + JSON.stringify(_this.state)));
            if (!_this.propsReceived && _this.operationalState.status !== Enums.OperationalStatus.Error) {
                _this.operationalState = {
                    status: Enums.OperationalStatus.Pending,
                    message: 'Status check successful. Receiving properties...'
                };

                // Inits the BACnet object properties
                _this.initProperties();
            }
            _this.logger.logDebug("ThermostatActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
            _this.publishOperationalStateChange();
        }, function (error) {
            _this.logger.logDebug("ThermostatActorDevice - status check failed: " + error);
            _this.operationalState = {
                status: Enums.OperationalStatus.Error,
                message: "Status check failed - device unreachable"
            };
            _this.logger.logDebug("ThermostatActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
            _this.publishOperationalStateChange();

            /*
            We are setting operational status to 'OK' by default here,
            cause we can't set it to 'OK' by default at the begining of every object's status flags
            - 'ERROR' status from the check of other objects may be lost.
            As it set to 'OK' in case of successful status check of all objects anyway,
            we just reset it to 'OK' here, after the publishing of 'ERROR' status
            */
            _this.operationalState.status = Enums.OperationalStatus.Ok;
        });
};

/**
 * Creates 'subscribtion' to the BACnet COV notifications.
 *
 * @return {void}
 */
Thermostat.prototype.subscribeToCOV = function () {
    var _this = this;
    // Handle 'Setpoint' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.setpointFeedbackObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.setpoint = bacnetProperties.presentValue.value;
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
            + ("Setpoint " + JSON.stringify(_this.state.setpoint)));
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
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
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
            + ("Temperature " + JSON.stringify(_this.state.temperature)));
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
            + ("Temperature COV notification was not received " + error));
        _this.publishStateChange();
    });

    // Handle 'Mode 'COV Notifications Flow
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
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
            + ("Mode " + JSON.stringify(_this.state.mode)));
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("ThermostatActorDevice - subscribeToCOV: "
            + ("Mode COV notification was not received " + error));
        _this.publishStateChange();
    });
}

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
Thermostat.prototype.subscribeToProperty = function () {
    var _this = this;
    
    // Read Property Flow
    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)));
    // Gets the 'stateText' property
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
        // Gets the 'presentValue|statusFlags' property
        _this.sendSubscribeCOV(_this.modeObjectId);
        _this.propsReceived = true;
        _this.operationalState = {
            status: Enums.OperationalStatus.Ok,
            message: 'Thermostat\'s properties successfully initialized'
        };
        _this.logger.logDebug("ThermostatActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        _this.publishOperationalStateChange();
    });

    // Gets the 'presentValue' (setpoint) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.setpointFeedbackObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.setpoint = bacnetProperty.value;
        _this.logger.logDebug("ThermostatActorDevice - subscribeToProperty: "
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
        _this.logger.logDebug("ThermostatActorDevice - subscribeToProperty: "
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
 * Sends the 'WriteProperty' confirmed request.
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
 * Sends the 'ReadProperty' confirmed request.
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
 * Sends the 'SubscribeCOV' confirmed request.
 *
 * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
 * @return {void}
 */
Thermostat.prototype.sendSubscribeCOV = function (objectId) {

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

Thermostat.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
Thermostat.prototype.setState = function (state) {
    this.logDebug('setState', state);
    if (_.isObjectLike(state)) {
        if (_.isNumber(state.setpoint) && state.setpoint !== this.state.setpoint) {
            var delta = state.setpoint - this.state.setpoint;
            this.setSetpointModification(delta);
        }
        this.state = _.cloneDeep(state);
    } else {
        this.state = {}
    }
};

Thermostat.prototype.createLogger = function () {
    var logger = new Logger(this);
    logger.setLogMethod(Enums.LogLevel.Debug, this.logDebug);
    logger.setLogMethod(Enums.LogLevel.Error, this.logError);
    logger.setLogMethod(Enums.LogLevel.Info, this.logInfo);
    return logger;
};

/**
 * Sends the 'writeProperty' request to set the setpoint of the 'presentValue' property.
 *
 * @param {number} setpointModifier
 * @return {Promise<void>}
 */
Thermostat.prototype.setSetpointModification = function (setpointModifier) {
    this.logger.logDebug('Thermostat - setSetpointModification: '
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
Thermostat.prototype.update = function () {
    this.logger.logDebug('Thermostat - update: '
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
Thermostat.prototype.incrementSetpoint = function () {
    this.logger.logDebug('Thermostat - incrementSetpoint: '
        + "Increments the setpoint value...");
    return this.setSetpointModification(1);
};
/**
 * Decrements the 'setpoint' value.
 *
 * @return {Bluebird<void>}
 */
Thermostat.prototype.decrementSetpoint = function () {
    this.logger.logDebug('Thermostat - decrementSetpoint: '
        + "Decrements the setpoint value...");
    return this.setSetpointModification(-1);
};