module.exports = {
    metadata: {
        plugin: "jalousie",
        label: "BACnet Jalousie Control",
        role: "actor",
        family: "jalousie",
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
                id: 'incrementRotation',
                label: 'Increment Rotation',
            },
            {
                id: 'decrementRotation',
                label: 'Decrement Rotation',
            },
            {
                id: 'stopMotion',
                label: 'Stop Motion',
            },
        ],
        state: [
            {
                id: 'initialized', label: 'Initialized',
                type: {
                    id: 'boolean',
                },
            }, {
                id: "position", label: "position",
                type: {
                    id: "decimal"
                }
            }, {
                id: "rotation", label: "rotation",
                type: {
                    id: "decimal"
                }
            }],
        configuration: [
            {
                label: "Position Feedback Object Id",
                id: "positionFeedbackObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Position Feedback Object Type",
                id: "positionFeedbackObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Position Modification Object Id",
                id: "positionModificationObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Position Modification Object Type",
                id: "positionModificationObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Position Step Size",
                id: "positionStepSize",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Rotation Feedback Object Id",
                id: "rotationFeedbackObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Rotation Feedback Object Type",
                id: "rotationFeedbackObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Rotation Modification Object Id",
                id: "rotationModificationObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Rotation Modification Object Type",
                id: "rotationModificationObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Rotation Up Value",
                id: "rotationUpValue",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Rotation Down Value",
                id: "rotationDownValue",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Rotation Step Size",
                id: "rotationStepSize",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Action Object Id",
                id: "actionObjectId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Action Object Type",
                id: "actionObjectType",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "Action Go Value",
                id: "actionGoValue",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Action Stop Value",
                    id: "actionStopValue",
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
        return new Jalousie();
    },

    discovery: function () {
        "use strict";
        return new JalousieDiscovery();
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
function Jalousie() { 
}

function JalousieDiscovery() {   
}

JalousieDiscovery.prototype.start = function () {
}

JalousieDiscovery.prototype.stop = function () {
}
/**
 *
 */
Jalousie.prototype.className = 'JalousieActorDevice';

Jalousie.prototype.start = function () {
    // Init the default state
    this.setState(this.state);
    
    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
Jalousie.prototype.stop = function () {
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

Jalousie.prototype.initDevice = function (deviceId) {
    // Init the default state
    this.setState(this.state);

    this.operationalState = {};

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

    // Subscribes to COV Notifications messages flows for 'motionDirection' and 'stopValue'
    this.subscribeToCOV();
    // Inits COV subscriptions
    this.initCOVSubscriptions();

    // Init status checks timer if polling time is provided
    if (this.statusChecksTimer.config.interval !== 0) {
        this.statusChecksTimer.start(function(interval) {
            this.subscribeToStatusCheck(interval);
            this.logger.logDebug("JalousieActorDevice - statusCheck: sending request" );
            this.sendReadProperty(this.positionFeedbackObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.positionModificationObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.rotationFeedbackObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.rotationModificationObjectId, BACnet.Enums.PropertyId.statusFlags);
            this.sendReadProperty(this.actionObjectId, BACnet.Enums.PropertyId.statusFlags);
        }.bind(this));
        this.operationalState = {
            status: Enums.OperationalStatus.Pending,
            message: "Waiting for Status Flags..."
        };
        this.logger.logDebug("JalousieActorDevice - operationalState: " + JSON.stringify(this.operationalState));
        this.publishOperationalStateChange();
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
Jalousie.prototype.preInit = function () {

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
Jalousie.prototype.initParamsFromConfig = function () {
    this.positionFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.positionFeedbackObjectId,
        this.config.positionFeedbackObjectType
    );

    this.positionModificationObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.positionModificationObjectId,
        this.config.positionModificationObjectType
    );

    this.rotationFeedbackObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.rotationFeedbackObjectId,
        this.config.rotationFeedbackObjectType
    );

    this.rotationModificationObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.rotationModificationObjectId,
        this.config.rotationModificationObjectType
    );

    this.actionObjectId = Helpers.BACnet.getBACnetObjectId(
        this.config.actionObjectId,
        this.config.actionObjectType
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
Jalousie.prototype.createPluginComponents = function () {
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
Jalousie.prototype.initProperties = function () {
};

/**
 * Sends 'subscribeCOV' for the BACnet objects
 *
 * @return {Promise<void>}
 */
Jalousie.prototype.initCOVSubscriptions = function () {

    // Gets the 'presentValue|statusFlags' property for 'position'
    this.sendSubscribeCOV(this.positionFeedbackObjectId);

    // Gets the 'presentValue|statusFlags' property for 'rotation'
    this.sendSubscribeCOV(this.rotationFeedbackObjectId);
};

/**
 * Maps status flags to operational state if they are presented.
 * @param {BACnet.Types.StatusFlags} statusFlags - parsed 'statusFlags' property of the actor
 *
 * @return {void}
 */
Jalousie.prototype.handleStausFlags = function (statusFlags, object) {
    var message = _.isArray(this.operationalState.message) ?
        _.concat(this.operationalState.message, (object + ": status check successful")) 
        : [object + ": status check successful"];
    if (statusFlags.value.inAlarm) {
        this.logger.logError("JalousieActorDevice - " + object + " - statusCheck: Alarm detected!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Alarm detected")) 
            : [object + ": Alarm detected"];
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    if (statusFlags.value.outOfService) {
        this.logger.logError("JalousieActorDevice - " + object + " - statusCheck: Physical device is out of service!");
        message = _.isArray(this.operationalState.message) ?
            _.concat(this.operationalState.message, (object + ": Out of service"))
            : [object + ": Out of service"];          
        this.operationalState = {
            status: Enums.OperationalStatus.Error
        };
    }
    if (statusFlags.value.fault) {
        this.logger.logError("JalousieActorDevice - " + object + " - statusCheck: Fault detected!");
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
Jalousie.prototype.subscribeToStatusCheck = function (interval) {
    var _this = this;
    var statusFlagsFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
            RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.statusFlags)));
    // Handle 'positionFeedbackObject' status flags
    var ovPosFeedbackFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.positionFeedbackObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovPosFeedbackFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'positionFeedbackObject');
            _this.logger.logDebug("JalousieActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'positionModificationObject' status flags
    var ovPosModFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.positionModificationObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovPosModFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'positionModificationObject');
            _this.logger.logDebug("JalousieActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'rotationFeedbackObject' status flags
    var ovRotFeedbackFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.rotationFeedbackObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovRotFeedbackFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'rotationFeedbackObject');
            _this.logger.logDebug("JalousieActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'rotationModificationObject' status flags
    var ovRotModFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.rotationModificationObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovRotModFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'rotationModificationObject');
            _this.logger.logDebug("JalousieActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    // Handle 'actionObject' status flags
    var ovActionFlags = statusFlagsFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.actionObjectId)),
            RxOp.first());
    this.subManager.subscribe = ovActionFlags
        .subscribe(function (resp) {
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags, 'actionObject');
            _this.logger.logDebug("JalousieActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
        });
    this.subManager.subscribe = Rx.combineLatest(ovPosFeedbackFlags, ovPosModFlags, ovRotFeedbackFlags, ovRotModFlags, ovActionFlags)
        .pipe(RxOp.timeout(interval))
        .subscribe(function() {
            _this.logger.logDebug("JalousieActorDevice - statusCheck: received status messages from all objects");
            _this.statusChecksTimer.reportSuccessfulCheck();
            if (_this.operationalState.status === Enums.OperationalStatus.Error) {
                _this.operationalState.message = _this.operationalState.message.join(', ')
            } else {
                _this.operationalState = {
                    status: Enums.OperationalStatus.Ok,
                    message: "Status check successful"
                }
            }
            _this.logger.logDebug("JalousieActorDevice - statusCheck: " +
                ("State " + JSON.stringify(_this.state)));

            // There is no props to receive

            _this.logger.logDebug("JalousieActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
            _this.publishOperationalStateChange();
        }, function (error) {
            _this.logger.logDebug("JalousieActorDevice - status check failed: " + error);
            _this.operationalState = {
                status: Enums.OperationalStatus.Error,
                message: "Status check failed - device unreachable"
            };
            _this.logger.logDebug("JalousieActorDevice - operationalState: " + JSON.stringify(_this.operationalState));
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
 * Creates 'subscribtion' to the BACnet object COV notifications flow.
 *
 * @return {void}
 */
Jalousie.prototype.subscribeToCOV = function () {
    var _this = this;
    // Handle 'Position' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.positionFeedbackObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.position = bacnetProperties.presentValue.value;
        _this.logger.logDebug("JalousieActorDevice - subscribeToProperty: "
            + ("Position " + JSON.stringify(_this.state.position)));
        _this.logger.logDebug("JalousieActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("JalousieActorDevice - subscribeToProperty: "
            + ("Position COV notification was not received " + error));
        _this.publishStateChange();
    });
    // Handle 'Rotation' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.rotationFeedbackObjectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.rotation = bacnetProperties.presentValue.value;
        _this.logger.logDebug("JalousieActorDevice - subscribeToProperty: "
            + ("Rotation " + JSON.stringify(_this.state.rotation)));
        _this.logger.logDebug("JalousieActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("JalousieActorDevice - subscribeToProperty: "
            + ("Rotation COV notification was not received " + error));
        _this.publishStateChange();
    });
}

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
Jalousie.prototype.subscribeToProperty = function () {
};

/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
Jalousie.prototype.getCOVNotificationValues = function (resp) {
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
Jalousie.prototype.sendWriteProperty = function (objectId, propId, values) {
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
Jalousie.prototype.sendReadProperty = function (objectId, propId) {
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
Jalousie.prototype.sendSubscribeCOV = function (objectId) {

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

Jalousie.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
Jalousie.prototype.setState = function (state) {
    this.logDebug('setState', state);
    if (_.isObjectLike(state)) { 
        if (this.state.position !== state.position || this.state.rotation !== state.rotation) {
            this.setModification(state.position, state.rotation);
        }
        this.state = state;
    } else {
        this.state = {}
    }
};

Jalousie.prototype.createLogger = function () {
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
Jalousie.prototype.setModification = function (position, rotation) {
    this.logger.logDebug('JalousieActorDevice - setModification: '
        + ("Modifying position (" + position + ") and rotation (" + rotation + ")"));
    this.sendWriteProperty(this.positionModificationObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetReal(position)]);
    this.sendWriteProperty(this.rotationModificationObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetReal(rotation)]);
    this.sendWriteProperty(this.actionObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetUnsignedInteger(this.config.actionGoValue)]);
    return Bluebird.resolve();
};

/**
 * TID API Methods
 */

/**
 * 
 */
Jalousie.prototype.raisePosition = function () {
    var targetPosition = this.state.position - this.config.positionStepSize;
    this.logDebug('JalousieActorDevice - raisePosition: '
        + ("Target Position " + targetPosition));
    this.setModification(targetPosition, this.config.rotationUpValue);
    return Bluebird.resolve();
};
/**
 * 
 */
Jalousie.prototype.lowerPosition = function () {
    var targetPosition = this.state.position + this.config.positionStepSize;
    this.logDebug('JalousieActorDevice - lowerPosition: '
        + ("Target Position " + targetPosition));
    this.setModification(targetPosition, this.config.rotationDownValue);
    return Bluebird.resolve();
};
/**
 * 
 */
Jalousie.prototype.positionUp = function () {
    this.logDebug('JalousieActorDevice - positionUp: '
        + "Called positionUp()");
    this.setModification(0, this.config.rotationUpValue);
    return Bluebird.resolve();
};
/**
 * 
 */
Jalousie.prototype.positionDown = function () {
    this.logDebug('JalousieActorDevice - positionDown: '
        + "Called positionUp()");
    this.setModification(100, this.config.rotationDownValue);
    return Bluebird.resolve();
};
/**
 * 
 */
Jalousie.prototype.incrementRotation = function () {
    var targetRotation = this.state.rotation + this.config.rotationStepSize;
    this.logDebug('JalousieActorDevice - incrementRotation: '
        + ("Target Rotation " + targetRotation));
    this.setModification(this.state.position, targetRotation);
    return Bluebird.resolve();
};
/**
 * 
 */
Jalousie.prototype.decrementRotation = function () {
    var targetRotation = this.state.rotation - this.config.rotationStepSize;
    this.logDebug('JalousieActorDevice - decrementRotation: '
        + ("Target Rotation " + targetRotation));
    this.setModification(this.state.position, targetRotation);
    return Bluebird.resolve();
};
/**
 * 
 */
Jalousie.prototype.stopMotion = function () {
    this.sendWriteProperty(this.actionObjectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetUnsignedInteger(this.config.actionStopValue)]);
    return Bluebird.resolve();
};