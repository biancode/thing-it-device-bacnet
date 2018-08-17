

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
            },
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
};

JalousieSimple.prototype.initDevice = function () {
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
JalousieSimple.prototype.initProperties = function () {

    // Gets the 'presentValue|statusFlags' property for 'motionDirection'
    this.sendSubscribeCOV(this.motionDirectionObjectId);

    // Gets the 'presentValue|statusFlags' property for 'stopValue'
    this.sendSubscribeCOV(this.stopValueObjectId);
};

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
JalousieSimple.prototype.subscribeToProperty = function () {
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
    // Read Property Flow
    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)));
    // Gets the 'presentValue' (position) property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.motionDirectionObjectId)), RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.motionDirection = bacnetProperty.value;
        _this.logger.logDebug("JalousieSimpleActorDevice - subscribeToProperty: "
            + ("Motion direction: " + bacnetProperty.value));
    });
    // Gets the 'presentValue' (rotation) property
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