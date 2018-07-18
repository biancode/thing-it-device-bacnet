module.exports = {
    metadata: {
        plugin: "multiStateInput",
        label: "BacNet Multi State Input",
        role: "actor",
        family: "multiStateInput",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [{
            id: "update",
            label: "Update"
        }],

        state: [
            {
                id: 'initialized', label: 'Initialized',
                type: {
                    id: 'boolean',
                },
            }, {
                id: "presentValue", label: "Present Value",
                type: {
                    id: "integer"
                }
            }, {
                id: "presentValueText", label: "Present Value Text",
                type: {
                    id: "string"
                }
            }, {
                id: "stateText", label: "State Text",
                type: {
                    id: "Object"
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
                label: 'Object Name',
                id: 'objectName',
                type: {
                    id: 'string',
                },
            }, {
                label: 'Description',
                id: 'description',
                type: {
                    id: 'string',
                },
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
                label: "Object Name",
                id: "objectName",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            /**
             * @deprecated
             */
            {
                label: "Description",
                id: "description",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            {
                label: "States",
                id: "states",
                type: {
                    id: "enumeration"
                },
                defaultValue: {zero: 0, one: 1}
            }
        ]
    },
    create: function () {
        "use strict";
        return new MultiStateInput();
    },

    discovery: function () {
        "use strict";
        return new MultiStateInputDiscovery();
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
function MultiStateInput() { 
}

function MultiStateInputDiscovery() {   
}

MultiStateInputDiscovery.prototype.start = function () {
}

MultiStateInputDiscovery.prototype.stop = function () {
}
/**
 *
 */
MultiStateInput.prototype.className = 'MultiStateInputActorDevice';

MultiStateInput.prototype.start = function () {
    // Init the default state
    this.setState(this.state);

    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
MultiStateInput.prototype.stop = function () {
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

MultiStateInput.prototype.initDevice = function () {
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
MultiStateInput.prototype.initSubManager = function () {

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
MultiStateInput.prototype.initParamsFromConfig = function () {
    this.objectId = Helpers.BACnet.getBACnetObjectId(
        this.config.objectId,
        this.config.objectType,
        BACnet.Enums.ObjectType.MultiStateInput,
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
MultiStateInput.prototype.createPluginComponents = function () {
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
MultiStateInput.prototype.initProperties = function () {

   // Gets the 'StateText' property for 'light state'
   this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.stateText);

   // Gets the 'objectName' property
   this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.objectName);

   // Gets the 'description' property
   this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.description);
};

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
MultiStateInput.prototype.subscribeToProperty = function () {
    var _this = this;
    // Handle 'State' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)))
        .subscribe(function (resp) {
        var bacnetProperties = _this
            .getCOVNotificationValues(resp);
        _this.state.presentValue = bacnetProperties.presentValue.value;
        var stateIndex = bacnetProperties.presentValue.value - 1;
        _this.state.presentValueText = _this.state.stateText[stateIndex];
        _this.state.outOfService = bacnetProperties.statusFlags.value.outOfService;
        _this.state.alarmValue = bacnetProperties.statusFlags.value.inAlarm;
        _this.logger.logDebug("MultiStateInputActorDevice - subscribeToProperty: "
            + ("presentValue " + JSON.stringify(_this.state.presentValue)));
        _this.logger.logDebug("MultiStateInputActorDevice - subscribeToProperty: "
            + ("State " + JSON.stringify(_this.state)));
        _this.publishStateChange();
    }, function (error) {
        _this.logger.logDebug("MultiStateInputActorDevice - subscribeToProperty: "
            + ("Multi State Input COV notification was not received " + error));
        _this.publishStateChange();
    });
    // Read Property Flow
    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)));
    // Gets the 'objectName' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.objectName)))
        .subscribe(function (resp) {
        var bacnetProperty = BACnet.Helpers.Layer
            .getPropertyValue(resp.layer);
        _this.state.objectName = bacnetProperty.value;
        _this.logger.logDebug("MultiStateInputActorDevice - subscribeToProperty: "
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
        _this.logger.logDebug("MultiStateInputActorDevice - subscribeToProperty: "
            + ("Object Description retrieved: " + _this.state.description));
        _this.publishStateChange();
    });
    // Gets the 'stateText' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.stateText)))
        .subscribe(function (resp) {
        var bacnetProperties = BACnet.Helpers.Layer
            .getPropertyValues(resp.layer);
        _this.state.stateText = _.map(bacnetProperties, function (stateTextItem) {
            return stateTextItem.value;
        });
        _this.logger.logDebug("MultiStateInputActorDevice - subscribeToProperty: "
            + ("States: " + JSON.stringify(_this.state.stateText)));
        _this.publishStateChange();
        // Gets the 'presentValue|statusFlags' property
        _this.sendSubscribeCOV(_this.objectId);
    });
};

/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
MultiStateInput.prototype.getCOVNotificationValues = function (resp) {
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
MultiStateInput.prototype.sendWriteProperty = function (objectId, propId, values) {
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
MultiStateInput.prototype.sendReadProperty = function (objectId, propId) {
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
MultiStateInput.prototype.sendSubscribeCOV = function (objectId) {

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

MultiStateInput.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
MultiStateInput.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
};

MultiStateInput.prototype.createLogger = function () {
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
 * Sends the 'readProperty' requests to get the values (temperature, setpoint)
 * of the 'presentValue' property.
 *
 * @return {Bluebird<void>}
 */
MultiStateInput.prototype.update = function () {
    this.logger.logDebug('MultiStateInputActorDevice - update: Called update()');

        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.presentValue);

        return Bluebird.resolve();
};
