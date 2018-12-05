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
        return new Light();
    },

    discovery: function () {
        return new LightDiscovery();
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
    if (this.statusChecksTimer) {
        this.statusChecksTimer.cancel();
        this.statusChecksTimer = null;
    }
};

Light.prototype.initDevice = function (deviceId) {
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
            this.logger.logDebug("LightActorDevice - statusCheck: sending request" );
            this.sendReadProperty(this.levelFeedbackObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.levelModificationObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.lightActiveFeedbackObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.lightActiveModificationObjectId, BACnet.Enums.PropertyId.statusFlags);
        }.bind(this));
        this.operationalState = {
            status: Enums.OperationalStatus.Pending,
            message: "Waiting for Status Flags..."
        };
        this.logger.logDebug("LightActorDevice - operationalState: " + JSON.stringify(this.operationalState));
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
Light.prototype.preInit = function () {

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
Light.prototype.initProperties = function () {

    // Gets the 'StateText' property for 'lightActiveFeedbackObject'
    this.sendReadProperty(this.lightActiveFeedbackObjectId, BACnet.Enums.PropertyId.stateText);
};

/**
 *  Sends 'subscribeCOV' for the BACnet objects.
 *
 * @return {Promise<void>}
 */
Light.prototype.initCOVSubscriptions = function () {

    // Gets the 'presentValue|statusFlags' property for 'dimmer level'
    this.sendSubscribeCOV(this.levelFeedbackObjectId);

    // For 'lightActiveFeedbackObject', we need to receive mode actor's 'stateText' array, and only then subscribe to notifications
 };

/**
 * Maps status flags to operational state if they are presented.
 * @param {BACnet.Types.StatusFlags} statusFlags - parsed 'statusFlags' property of the actor
 *
 * @return {void}
 */
Light.prototype.handleStausFlags = function (statusFlags, object) {
    var message = _.isArray(this.operationalState.message) ?
        _.concat(this.operationalState.message, (object + ": status check successful")) 
        : [object + ": status check successful"];
    if (statusFlags.value.inAlarm) {
        this.logger.logError("LightActorDevice - " + object + " - statusCheck: Alarm detected!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Alarm detected")) 
            : [object + ": Alarm detected"];
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    if (statusFlags.value.outOfService) {
        this.logger.logError("LightActorDevice - " + object + " - statusCheck: Physical device is out of service!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Out of service"))
            : [object + ": Out of service"];          
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    if (statusFlags.value.fault) {
        this.logger.logError("LightActorDevice - " + object + " - statusCheck: Fault detected!");
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
Light.prototype.subscribeToStatusCheck = function (interval) {
    var _this = this;
    var statusFlagsFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
            RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.statusFlags)));
    // Handle 'levelFeedbackObject' status flags
    var ovLvlFeedbackFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.levelFeedbackObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovLvlFeedbackFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'levelFeedbackObject');
            _this.logger.logDebug("LightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'levelModificationObject' status flags
    var ovLvlModFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.levelModificationObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovLvlModFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'levelModificationObject');
            _this.logger.logDebug("LightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'lightActiveFeedbackObject' status flags
    var ovLAFeedbackFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.lightActiveFeedbackObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovLAFeedbackFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'lightActiveFeedbackObject');
            _this.logger.logDebug("LightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'lightActiveModificationObject' status flags
    var ovLAModFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.lightActiveModificationObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovLAModFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'lightActiveModificationObject');
            _this.logger.logDebug("LightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    this.subManager.subscribe = Rx.combineLatest(ovLvlFeedbackFlags, ovLvlModFlags, ovLAFeedbackFlags, ovLAModFlags)
        .pipe(RxOp.timeout(interval))
        .subscribe(function() {
            _this.logger.logDebug("LightActorDevice - statusCheck: received status messages from all objects");
            _this.statusChecksTimer.reportSuccessfulCheck();
            if (_this.operationalState.status === Enums.OperationalStatus.Error) {
                _this.operationalState.message = _this.operationalState.message.join(', ')
            } else {
                _this.operationalState = {
                    status: Enums.OperationalStatus.Ok,
                    message: "Status check successful"
                }
            }
            _this.logger.logDebug("LightActorDevice - statusCheck: " +
                ("State " + JSON.stringify(_this.state)));
            if (!_this.propsReceived && _this.operationalState.status !== Enums.OperationalStatus.Error) {
                _this.operationalState = {
                    status: Enums.OperationalStatus.Pending,
                    message: 'Status check successful. Receiving properties...'
                };

                // Inits the BACnet object properties
                _this.initProperties();
            }
            _this.logger.logDebug("LightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
            _this.publishOperationalStateChange();
        }, function (error) {
            _this.logger.logDebug("LightActorDevice - status check failed: " + error);
            _this.operationalState = {
                status: Enums.OperationalStatus.Error,
                message: "Status check failed - device unreachable"
            };
            _this.logger.logDebug("LightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
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
Light.prototype.subscribeToCOV = function () {
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
}

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
Light.prototype.subscribeToProperty = function () {
    var _this = this;
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
        _this.propsReceived = true;
        _this.operationalState = {
            status: Enums.OperationalStatus.Ok,
            message: 'Light\'s properties successfully initialized'
        };
        _this.logger.logDebug("LightActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        _this.publishOperationalStateChange();
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

Light.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
Light.prototype.setState = function (state) {
    this.logDebug('setState', state);
    if (_.isObjectLike(state)) {
        state.dimmerLevel = _.isNil(state.dimmerLevel) ? NaN : +state.dimmerLevel;
        if (this.state.dimmerLevel !== state.dimmerLevel && !_.isNaN(state.dimmerLevel)) {
            this.setDimmerLevelModification(state.dimmerLevel)
        }
        if (this.state.lightActive !== state.lightActive) {
            var lightModification = state.lightActive
                ? this.configuration.lightActiveModificationValueOn
                : this.configuration.lightActiveModificationValueOff;
            this.setLightActiveModification(lightModification);
        }
        this.state = _.cloneDeep(state);
    } else {
        this.state = {}
    }
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
    if (_.isNil(paramValue)) {
        throw new APIError('LightActorDevice - changeDimmer: No value provided to change!');
    }
    this.setDimmerLevelModification(+paramValue);
    return Bluebird.resolve();
};