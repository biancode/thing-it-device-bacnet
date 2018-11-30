module.exports = {
    metadata: {
        plugin: "jalousieSimple",
        label: "BACnet Jalousie Simple Control",
        role: "actor",
        family: "jalousieSimple",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [
            {
                id: 'raisePosition',
                label: 'Raise Position',
            },
            {
                id: 'lowerPosition',
                label: 'Lower Position',
            },
            {
                id: 'positionUp',
                label: 'Position Up',
            },
            {
                id: 'positionDown',
                label: 'Position Down',
            },
            {
                id: 'openBlade',
                label: 'Open Blade',
            },
            {
                id: 'closeBlade',
                label: 'Close Blade',
            },
            {
                id: 'stopMotion',
                label: 'Stop Motion',
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
                id: "motionDirection", label: "Motion Direction",
                type: {
                    id: "int"
                }
            }, {
                id: "stopValue", label: "Stop Value",
                type: {
                    id: "boolean"
                }
            }],
        configuration: [
            {
                label: "Motion Direction Object Id",
                id: "motionDirectionObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Motion Direction Object Type",
                id: "motionDirectionObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Stop Value Object Id",
                id: "stopValueObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Stop Value Object Type",
                id: "stopValueObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Step Duration (s)",
                id: "stepDuration",
                type: {
                    id: "integer"
                },
                defaultValue: "5"
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
        return new JalousieSimple();
    },

    discovery: function () {
        "use strict";
        return new JalousieSimpleDiscovery();
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
function JalousieSimple() { 
}

function JalousieSimpleDiscovery() {   
}

JalousieSimpleDiscovery.prototype.start = function () {
}

JalousieSimpleDiscovery.prototype.stop = function () {
}
/**
 *
 */
JalousieSimple.prototype.className = 'JalousieSimpleActorDevice';

JalousieSimple.prototype.start = function () {
    // Init the default state
    this.setState(this.state);

    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
JalousieSimple.prototype.stop = function () {
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

JalousieSimple.prototype.initDevice = function (deviceId) {
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

    // Subscribes to COV Notifications messages flows for 'motionDirection' and 'stopValue'
    this.subscribeToCOV();
    // Creates 'subscribtion' to the BACnet object properties
    this.subscribeToProperty();

    // Inits COV subscriptions
    this.initCOVSubscriptions();

    // Init status checks timer if polling time is provided
    if (this.statusChecksTimer.config.interval !== 0) {
        this.statusChecksTimer.start(function(interval) {
            this.subscribeToStatusCheck(interval);
            this.logger.logDebug("JalousieSimpleActorDevice - statusCheck: sending request" );
            this.sendReadProperty(this.motionDirectionObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.stopValueObjectId, BACnet.Enums.PropertyId.statusFlags);
        }.bind(this));
        this.operationalState = {
            status: Enums.OperationalStatus.Pending,
            message: "Waiting for Status Flags..."
        };
        this.logger.logDebug("JalousieSimpleActorDevice - operationalState: " + JSON.stringify(this.operationalState));
        this.publishOperationalStateChange();
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
JalousieSimple.prototype.initSubManager = function () {

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
JalousieSimple.prototype.initParamsFromConfig = function () {
    this.motionDirectionObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.motionDirectionObjectId,
        this.config.motionDirectionObjectType
    );

    this.stopValueObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.stopValueObjectId,
        this.config.stopValueObjectType
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
JalousieSimple.prototype.createPluginComponents = function () {
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
JalousieSimple.prototype.initProperties = function () {
};

/**
 * Sends 'subscribeCOV' for the BACnet objects
 *
 * @return {Promise<void>}
 */
JalousieSimple.prototype.initCOVSubscriptions = function () {

    // Gets the 'presentValue|statusFlags' property for 'motionDirection'
    this.sendSubscribeCOV(this.motionDirectionObjectId);

    // Gets the 'presentValue|statusFlags' property for 'stopValue'
    this.sendSubscribeCOV(this.stopValueObjectId);
};

/**
 * Maps status flags to operational state if they are presented.
 * @param {BACnet.Types.StatusFlags} statusFlags - parsed 'statusFlags' property of the actor
 *
 * @return {void}
 */
JalousieSimple.prototype.handleStausFlags = function (statusFlags, object) {
    var message = _.isArray(this.operationalState.message) ?
        _.concat(this.operationalState.message, (object + ": status check successful")) 
        : [object + ": status check successful"];
    if (statusFlags.value.inAlarm) {
        this.logger.logError("JalousieSimpleActorDevice - " + object + " - statusCheck: Alarm detected!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Alarm detected")) 
            : [object + ": Alarm detected"];
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    if (statusFlags.value.outOfService) {
        this.logger.logError("JalousieSimpleActorDevice - " + object + " - statusCheck: Physical device is out of service!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Out of service"))
            : [object + ": Out of service"];          
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    if (statusFlags.value.fault) {
        this.logger.logError("JalousieSimpleActorDevice - " + object + " - statusCheck: Fault detected!");
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
JalousieSimple.prototype.subscribeToStatusCheck = function (interval) {
    var _this = this;
    var statusFlagsFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
            RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.statusFlags)));
    // Handle 'motionDirectionObject' status flags
    var ovMotionDirFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.motionDirectionObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovMotionDirFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'motionDirectionObject');
            _this.logger.logDebug("JalousieSimpleActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'stopValueObject' status flags
    var ovStopValueFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.stopValueObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovStopValueFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'stopValueObject');
            _this.logger.logDebug("JalousieSimpleActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    this.subManager.subscribe = Rx.combineLatest(ovMotionDirFlags, ovStopValueFlags)
        .pipe(RxOp.timeout(interval))
        .subscribe(function() {
            _this.logger.logDebug("JalousieSimpleActorDevice - statusCheck: received status messages from all objects");
            _this.statusChecksTimer.reportSuccessfulCheck();
            if (_this.operationalState.status === Enums.OperationalStatus.Error) {
                _this.operationalState.message = _this.operationalState.message.join(', ')
            } else {
                _this.operationalState = {
                    status: Enums.OperationalStatus.Ok,
                    message: "Status check successful"
                }
            }
            _this.logger.logDebug("JalousieSimpleActorDevice - statusCheck: " +
                ("State " + JSON.stringify(_this.state)));

            // There is no properties to receive in JalousieSimple

            _this.logger.logDebug("JalousieSimpleActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
            _this.publishOperationalStateChange();
        }, function (error) {
            _this.logger.logDebug("JalousieSimpleActorDevice - status check failed: " + error);
            _this.operationalState = {
                status: Enums.OperationalStatus.Error,
                message: "Status check failed - device unreachable"
            };
            _this.logger.logDebug("JalousieSimpleActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
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
 * Creates 'subscribtion' to the BACnet object COV Notifications.
 *
 * @return {void}
 */
JalousieSimple.prototype.subscribeToCOV = function () {
    var _this = this;
    // Handle 'Motion Direction' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.motionDirectionObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.motionDirection = bacnetProperties.presentValue.value;
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("Motion Direction " + JSON.stringify(_this.state.motionDirection)));
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("Motion Direction COV notification was not received " + error));
        _this.publishStateChange();
    });
    // Handle 'Stop Value' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.stopValueObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.stopValue = bacnetProperties.presentValue.value === 1;
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("Stop value " + JSON.stringify(_this.state.stopValue)));
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("Stop value COV notification was not received " + error));
        _this.publishStateChange();
    });
}

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
JalousieSimple.prototype.subscribeToProperty = function () {
    var _this = this;
    
    // Read Property Flow
    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)));
    // Gets the 'presentValue' (motion direction) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.motionDirectionObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.motionDirection = bacnetProperty.value;
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("Motion direction: " + bacnetProperty.value));
    });
    // Gets the 'presentValue' (stop value) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.stopValueObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.stopValue = bacnetProperty.value === 1;
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("Stop value: " + bacnetProperty.value));
    });
};

/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
JalousieSimple.prototype.getCOVNotificationValues = function (resp) {
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
JalousieSimple.prototype.sendWriteProperty = function (objectId, propId, values) {
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
JalousieSimple.prototype.sendReadProperty = function (objectId, propId) {
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
JalousieSimple.prototype.sendSubscribeCOV = function (objectId) {

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

JalousieSimple.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
JalousieSimple.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
    return Bluebird.resolve();
};

JalousieSimple.prototype.createLogger = function () {
    var logger = new Logger(this);
    logger.setLogMethod(Enums.LogLevel.Debug, this.logDebug);
    logger.setLogMethod(Enums.LogLevel.Error, this.logError);
    logger.setLogMethod(Enums.LogLevel.Info, this.logInfo);
    return logger;
};

/**
 * Sets new direction of the motion.
 *
 * @param  {number} targetState - new motion direction
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.setMotion = function (targetState) {
    this.logger.logDebug('JalousieSimpleActorDevice - setMotion: '
        + ("Modifying motion state " + targetState));
    var promise = Bluebird.resolve();
    var _this = this;
    if (this.state.motionDirection === targetState) {
        if (this.state.motionDirection === Enums.MotionDirection.Down) {
            promise = this.setMotion(Enums.MotionDirection.Up);
        } else {
            promise = this.setMotion(Enums.MotionDirection.Down);
        }
    }
    this.state.motionDirection = targetState;
    this.publishStateChange();
    return promise.then(function() {
        this.sendWriteProperty(this.motionDirectionObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetEnumerated(targetState)]);
    }.bind(this));
};

/**
 * Sets the 'stopValue' state.
 *
 * @param  {boolean} targetState - new stop value
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.setStopMotion = function (targetState) {
    this.logger.logDebug('JalousieSimpleActorDevice - stopMotion: '
        + ("Setting stop motion value " + targetState));
    this.state.stopValue = !!targetState;
    this.publishStateChange();
    this.sendWriteProperty(this.stopValueObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetEnumerated(+this.state.stopValue)]);
    return Bluebird.resolve();
};

/**
 * TID API Methods
 */

/**
 * Toggles the 'stopValue' state.
 *
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.stopMotion = function () {
    this.logger.logDebug('JalousieSimpleActorDevice - stopMotion: '
        + "Toggling stop value");
    var targetValue = !this.state.stopValue;
    this.setStopMotion(targetValue);
    return Bluebird.resolve();
};
/**
 * Starts the step of 'raise' operation.
 *
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.raisePosition = function () {
    var _this = this;
    this.logger.logDebug('JalousieSimpleActorDevice - lowerPosition: '
        + "Raise Position...");
    return this.positionUp()
        .delay(this.config.stepDuration * 1000)
        .then(function () { return _this.stopMotion(); });
};
/**
 * Starts the step of 'lower' operation.
 *
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.lowerPosition = function () {
    var _this = this;
    this.logger.logDebug('JalousieSimpleActorDevice - lowerPosition: '
        + "Lower Position...");
    return this.positionDown()
        .delay(this.config.stepDuration * 1000)
        .then(function () { return _this.stopMotion(); });
};
/**
 * Sets the 'UP' motion direction.
 *
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.positionUp = function () {
    this.logger.logDebug('JalousieSimpleActorDevice - positionUp: '
        + "Set Position Up...");
    return this.setMotion(Enums.MotionDirection.Up);
};
/**
 * Sets the 'DOWN' motion direction.
 *
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.positionDown = function () {
    this.logger.logDebug('JalousieSimpleActorDevice - positionDown: '
        + "Set Position Down...");
    return this.setMotion(Enums.MotionDirection.Down);
};
/**
 * Sets the 'UP' motion direction (fixed delay).
 *
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.openBlade = function () {
    var _this = this;
    this.logger.logDebug('JalousieSimpleActorDevice - openBlade: '
        + "Open blade...");
    return this.positionUp()
        .delay(1000)
        .then(function () { return _this.stopMotion(); });
};
/**
 * Sets the 'DOWN' motion direction (fixed delay).
 *
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.closeBlade = function () {
    var _this = this;
    this.logger.logDebug('JalousieSimpleActorDevice - closeBlade: '
        + "Close blade...");
    return this.positionDown()
        .delay(1000)
        .then(function () { return _this.stopMotion(); });
};
/**
 * Sends the 'ReadProperty' request to update the motion direction and stop value params.
 *
 * @return {Bluebird<void>}
 */
JalousieSimple.prototype.update = function () {
    this.logger.logDebug('JalousieSimpleActorDevice - update: '
        + "Updating values...");
    this.sendReadProperty(this.motionDirectionObjectId, BACnet.Enums.PropertyId.presentValue);
    this.sendReadProperty(this.stopValueObjectId, BACnet.Enums.PropertyId.presentValue);
    return Bluebird.resolve();
};