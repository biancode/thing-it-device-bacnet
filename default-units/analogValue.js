module.exports = {
    metadata: {
        plugin: "analogValue",
        label: "BacNet Analog Value",
        role: "actor",
        family: "analogValue",
        deviceTypes: ["bacnet/bacNetDevice"],
        services: [{
            id: "update",
            label: "Update"
        }, {
            id: "setPresentValue",
            label: "Set Present Value"
        }, {
            id: "changeValue",
            label: "Change Value"
        }],

        state: [
            {
                id: 'initialized', 
                label: 'Initialized',
                type: {
                    id: 'boolean',
                },
            },
            {
                id: "presentValue", 
                label: "Present Value",
                type: {
                    id: "decimal"
                }
            },
            // TODO: Remove this property from state when operational state will be fully implemented
            /**
             * @deprecated
             */
            {
                id: "alarmValue", 
                label: "Alarm Value",
                type: {
                    id: "boolean"
                }
            },
            // TODO: Remove this property from state when operational state will be fully implemented
            /**
             * @deprecated
             */
            {
                id: "outOfService",
                label: "Out of Service",
                type: {
                    id: "boolean"
                }
            }, {
                id: "min",
                label: "Min",
                type: {
                    id: "float"
                }
            }, {
                id: "max",
                label: "Max",
                type: {
                    id: "float"
                }
            }, {
                label: 'Object Name',
                id: 'objectName',
                type: {
                    id: 'string',
                },
                defaultValue: 'AnalogValue',
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
        configuration: [{
                label: 'Read-only',
                id: 'readonly',
                type: {
                    id: 'boolean',
                },
                defaultValue: '',
            },
            {
                label: 'Write-only',
                id: 'writeonly',
                type: {
                    id: 'boolean',
                },
                defaultValue: '',
            },
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
            /**
             * @deprecated
             */
            {
                label: "Unit",
                id: "unit",
                type: {
                    id: "string"
                },
                defaultValue: ""
            },
            /**
             * @deprecated
             */
            {
                label: "Minimum Value",
                id: "minValue",
                type: {
                    id: "decimal"
                },
                defaultValue: 0
            },
            /**
             * @deprecated
             */
            {
                label: "Maximum Value",
                id: "maxValue",
                type: {
                    id: "decimal"
                },
                defaultValue: 100
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
        return new AnalogValue();
    },

    discovery: function () {
        "use strict";
        return new AnalogValueDiscovery();
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
var StatusTimerConfig = require("../lib/configs/status-timer.config")

/**
 *
 */
function AnalogValue() {}

function AnalogValueDiscovery() {}

AnalogValueDiscovery.prototype.start = function () {}

AnalogValueDiscovery.prototype.stop = function () {}

AnalogValue.prototype.className = 'AnalogValueActorDevice';
/**
 *
 */
AnalogValue.prototype.start = function () {
    // Init the default state
    this.setState(this.state);

    this.isDestroyed = false;

    return Bluebird.resolve();
}
/**
 *
 */
AnalogValue.prototype.stop = function () {
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
    this.statusChecksTimer.cancel();
    this.statusChecksTimer = null;
};

AnalogValue.prototype.initDevice = function (deviceId) {
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

    // Creates the 'presentValue|statusFlags' property subscription
    this.sendSubscribeCOV(this.objectId);

    // Init status checks timer if polling time is provided
    if (this.statusChecksTimer.config.interval !== 0) {
        this.statusChecksTimer.start(function(interval) {
            this.subscribeToStatusCheck(interval);
            this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.statusFlags);
        }.bind(this));
        this.operationalState = {
            status: Enums.OperationalStatus.Pending,
            message: "Waiting for Status Flags..."
        }
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
AnalogValue.prototype.initSubManager = function () {

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
AnalogValue.prototype.initParamsFromConfig = function () {
    this.objectId = Helpers.BACnet.getBACnetObjectId(
        this.config.objectId,
        BACnet.Enums.ObjectType.AnalogValue
    );
};

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
AnalogValue.prototype.createPluginComponents = function () {
    /* Create and init BACnet Flow Manager */
    this.flowManager = store.getState(['bacnet', this.deviceId, 'flowManager']);
    /* Create and init BACnet Service Manager */
    this.serviceManager = store.getState(['bacnet', this.deviceId, 'serviceManager']);
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
AnalogValue.prototype.initProperties = function () {

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
};

/**
 * Maps status flags to operational state if they are presented.
 * @param {BACnet.Types.StatusFlags} statusFlags - parsed 'statusFlags' property of the actor
 *
 * @return {void}
 */
AnalogValue.prototype.handleStausFlags = function (statusFlags) {
    this.state.outOfService = statusFlags.value.outOfService;
    this.state.alarmValue = statusFlags.value.inAlarm;
    if (statusFlags.value.inAlarm) {
        this.logger.logError("AnalogValueActorDevice - statusCheck: " +
            "Actor alarm detected!");
        this.operationalState = {
            status: Enums.OperationalStatus.Error,
            message: "Alarm detected"
        };
    }
    if (statusFlags.value.outOfService) {
        this.logger.logError("AnalogValueActorDevice - statusCheck: " +
            "Physical device is out of service!");
        this.operationalState = {
            status: Enums.OperationalStatus.Error,
            message: "Out of service"
        };
    }
    if (statusFlags.value.fault) {
        this.logger.logError("AnalogValueActorDevice - statusCheck: " +
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
AnalogValue.prototype.subscribeToStatusCheck = function (interval) {
    var _this = this;
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
            RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            RxOp.filter(Helpers.FlowFilter.isBACnetObject(_this.objectId)),
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.statusFlags)),
            RxOp.timeout(interval),
            RxOp.first())
        .subscribe(function (resp) {
            _this.logger.logDebug("AnalogValueActorDevice - statusCheck successful");
            _this.statusChecksTimer.reportSuccessfulCheck();
            _this.operationalState = {
                status: Enums.OperationalStatus.Ok,
                message: "Status check successful"
            };
            var statusFlags = BACnet.Helpers.Layer.getPropertyValue(resp.layer);
            _this.handleStausFlags(statusFlags);
            _this.logger.logDebug("AnalogValueActorDevice - statusCheck: " +
                ("State " + JSON.stringify(_this.state)));
            _this.publishOperationalStateChange();
            if (!_this.propsReceived && _this.operationalState.status !== Enums.OperationalStatus.Error) {
                _this.operationalState = {
                    status: Enums.OperationalStatus.Pending,
                    message: 'Status check successful. Receiving properties...'
                };
                // Creates 'subscribtion' to the BACnet object properties
                _this.subscribeToProperty();

                // Inits the BACnet object properties
                _this.initProperties();
            }

        }, function (error) {
            _this.logger.logDebug("AnalogValueActorDevice - status check failed: " + error);
            _this.operationalState = {
                status: Enums.OperationalStatus.Error,
                message: "Status check failed - device unreachable"
            };
            _this.publishOperationalStateChange();
        });

};

/**
 * Creates 'subscribtion' to the BACnet object properties.
 *
 * @return {void}
 */
AnalogValue.prototype.subscribeToProperty = function () {
    var _this = this;
    // Handle 'Present Value' COV Notifications Flow
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)), RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.covNotification)), RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)))
        .subscribe(function (resp) {
            var bacnetProperties = _this
                .getCOVNotificationValues(resp);
            _this.state.presentValue = bacnetProperties.presentValue.value;
            _this.operationalState = {
                status: Enums.OperationalStatus.Ok,
                message: "Received COV Notification"
            };
            _this.handleStausFlags(bacnetProperties.statusFlags);
            _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
                + ("presentValue " + JSON.stringify(_this.state.presentValue)));
            _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
                + ("State " + JSON.stringify(_this.state)));
            if (_this.statusChecksTimer.started) {
                _this.statusChecksTimer.reportSuccessfulCheck();
                _this.statusChecksTimer.reset();
            }
            _this.publishOperationalStateChange();
            _this.publishStateChange();
        }, function (error) {
            _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
                + ("Analog Value COV notification was not received " + error));
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
            _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
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
        _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
            + ("Min value for 'Present Value' property retrieved: " + _this.state.min));
            _this.publishStateChange();
        });
    // Gets the 'objectName' property
    var ovObjectName = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.objectName)))
        .subscribe(function (resp) {
            var bacnetProperty = BACnet.Helpers.Layer
                .getPropertyValue(resp.layer);
            _this.state.objectName = bacnetProperty.value;
        _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
            + ("Object Name retrieved: " + _this.state.objectName));
            _this.publishStateChange();
        });
    this.subManager.subscribe = ovObjectName;
    // Gets the 'description' property
    var ovDescription = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.description)))
        .subscribe(function (resp) {
            var bacnetProperty = BACnet.Helpers.Layer
                .getPropertyValue(resp.layer);
            _this.state.description = bacnetProperty.value;
        _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
            + ("Object Description retrieved: " + _this.state.description));
            _this.publishStateChange();
        });
    this.subManager.subscribe = ovDescription;
    // Gets the 'units' property
    this.subManager.subscribe = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.units)))
        .subscribe(function (resp) {
            var bacnetProperty = BACnet.Helpers.Layer
                .getPropertyValue(resp.layer);
            var unit = BACnet.Enums.EngineeringUnits[bacnetProperty.value];
            _this.state.unit = _.isNil(unit) ? 'none' : unit;
        _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
            + ("Object Unit retrieved: " + _this.state.unit));
            _this.publishStateChange();
        });
    // Gets the 'presentValue' property
    var ovUnits = readPropertyFlow
        .pipe(RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.presentValue)))
        .subscribe(function (resp) {
            var bacnetProperty = BACnet.Helpers.Layer
                .getPropertyValue(resp.layer);
            _this.state.presentValue = bacnetProperty.value;
        _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
            + ("Object Present Value retrieved: " + _this.state.presentValue));
            _this.publishStateChange();
        });
    this.subManager.subscribe = ovUnits;
    // 'Min' and 'max' present value properties are optional and may be missing
    this.subManager.subscribe = Rx.combineLatest( ovObjectName, ovDescription, ovUnits)
        .pipe(RxOp.first())
        .subscribe(function() {
            _this.propsReceived = true;
            _this.operationalState = {
                status: Enums.OperationalStatus.Ok,
                message: 'Major properties successfully initialized'
            };
            _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
                + "main properties were received");
            _this.logger.logDebug("AnalogValueActorDevice - subscribeToProperty: "
                + ("Actor details: " + JSON.stringify(this.state)));
            _this.publishOperationalStateChange();
        })
};

/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
AnalogValue.prototype.getCOVNotificationValues = function (resp) {
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
    return {
        presentValue: presentValue,
        statusFlags: statusFlags
    };
};

/**
 * Sends the 'WriteProperty' confirmed request.
 *
 * @param  {BACnet.Types.BACnetObjectId} objectId - BACnet object identifier
 * @param  {BACnet.Enums.PropertyId} propId - BACnet property identifier
 * @param  {BACnet.Types.BACnetTypeBase[]} values - BACnet property values
 * @return {void}
 */
AnalogValue.prototype.sendWriteProperty = function (objectId, propId, values) {
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
AnalogValue.prototype.sendReadProperty = function (objectId, propId) {
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
AnalogValue.prototype.sendSubscribeCOV = function (objectId) {

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

AnalogValue.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
AnalogValue.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
};

AnalogValue.prototype.createLogger = function () {
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
AnalogValue.prototype.update = function () {
    this.logger.logDebug('Called update()');
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.presentValue);
    return Bluebird.resolve();
};

/**
 * Sends the 'writeProperty' request to set the value of the 'presentValue' property.
 *
 * @param  {number} presentValue - value of the 'presentValue' property.
 * @return {Bluebird<void>}
 */
AnalogValue.prototype.setPresentValue = function (presentValue) {
    this.logger.logDebug('AnalogValue - setPresentValue: Called setPresentValue()');
    this.sendWriteProperty(this.objectId, BACnet.Enums.PropertyId.presentValue, [new BACnet.Types.BACnetReal(presentValue)]);
    return Bluebird.resolve();
};
/**
 * Calls the 'setPresentValue' method to set the value of the 'presentValue' property.
 *
 * @param  {{value:number}} parameters
 * @return {Bluebird<void>}
 */
AnalogValue.prototype.changeValue = function (parameters) {
    this.logger.logDebug('Change value requested with parameters: ', parameters);
    var presentValue = _.get(parameters, 'value');
    if (!_.isNumber(presentValue)) {
        throw new APIError('AnalogValue - changeValue: No value provided to change!');
    }
    this.setPresentValue(parameters.value);
    return Bluebird.resolve();
};
