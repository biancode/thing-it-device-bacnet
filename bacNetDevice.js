"use strict";

module.exports = {
    metadata: {
        family: 'bacnet',
        plugin: 'bacNetDevice',
        label: 'BACnet Device',
        manufacturer: '',
        discoverable: true,
        tangible: true,
        additionalSoftware: [],
        actorTypes: [],
        sensorTypes: [],
        services: [{
            id: "update",
            label: "Update"
        }],
        state: [{
            id: "initialized",
            label: "Initialized",
            type: {
                id: "boolean"
            }
        }, {
            id: "name",
            label: "Name",
            type: {
                id: "string"
            },
            defaultValue: ""
        }, {
            id: "description",
            label: "Description",
            type: {
                id: "string"
            },
            defaultValue: ""
        }, {
            id: "vendor",
            label: "Vendor",
            type: {
                id: "string"
            },
            defaultValue: ""
        }, {
            id: "model",
            label: "Model",
            type: {
                id: "string"
            },
            defaultValue: ""
        }, {
            id: "softwareVersion",
            label: "Software Version",
            type: {
                id: "string"
            },
            defaultValue: ""
        }
        ],
        configuration: [
            {
                label: "IP Address",
                id: "ipAddress",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "IP Match Required",
                id: "ipMatchRequired",
                type: {
                    id: "boolean"
                },
                defaultValue: ""
            }, {
                label: "URL",
                id: "url",
                type: {
                    id: "string"
                },
                defaultValue: ""
            }, {
                label: "URL Lookup Required",
                id: "urlLookupRequired",
                type: {
                    id: "boolean"
                },
                defaultValue: ""
            }, {
                label: "Port",
                id: "port",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Device-ID",
                id: "deviceId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Device-ID Match Required",
                id: "deviceIdMatchRequired",
                type: {
                    id: "boolean"
                },
                defaultValue: ""
            }, {
                label: "Vendor-ID",
                id: "vendorId",
                type: {
                    id: "integer"
                },
                defaultValue: ""
            }, {
                label: "Vendor-ID Match Required",
                id: "vendorIdMatchRequired",
                type: {
                    id: "boolean"
                },
                defaultValue: ""
            }, {
                label: "Omit WhoIs Confirmation",
                id: "omitWhoIsConfirmation",
                type: {
                    id: "boolean"
                },
                defaultValue: ""
            }, {
                label: "Priority",
                id: "priority",
                type: {
                    id: "integer"
                },
                defaultValue: 16
            }, {
                label: 'Unicast WhoIs Confirmation',
                id: 'unicastWhoIsConfirmation',
                type: {
                    id: 'boolean',
                },
                defaultValue: '',
            }
        ]
    },
    create: function () {
        "use strict";
        return new BACNetDevice();
    },
    discovery: function () {
        "use strict";
        return new BACNetDiscovery();
    }
};

var dns = require("dns");
var _ = require("lodash");
var Bluebird = require("bluebird");
Bluebird.prototype.fail = Bluebird.prototype.catch;
var Rx = require("rxjs");
var RxOp = require("rxjs/operators");
// var combineLatest = require("rxjs/observable/combineLatest");
var store = require("./lib/redux").store;
/* Plugin devices */
var BACnetAction = require("./lib/redux/actions").BACnetAction;
var APIError = require("./lib/errors").APIError;
var Configs = require("./lib/configs");
var Sockets = require("./lib/sockets");
var Managers = require("./lib/managers");
var Helpers = require("./lib/helpers");
var BACnet = require("tid-bacnet-logic");
var Logger = require("./lib/utils").Logger;
var Enums = require("./lib/enums");

function BACNetDiscovery() {    
}

BACNetDiscovery.prototype.start = function () {
};

BACNetDiscovery.prototype.stop = function () {
};


function BACNetDevice() {
    
}

BACNetDevice.prototype.start = function () {
    this.isDestroyed = false;

    return Bluebird.map(this.actors, function (actor) {
        return actor.initSubManager();
    }, { concurrency: 1 })
    .then((function() {
        return this.initDevice()
    }).bind(this))
    .catch((function(error) {
        this.logError('BACNetDeviceController - start: ' + error);
    }).bind(this));
};

BACNetDevice.prototype.stop = function () {
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
    return this.socketServer.destroy()
    .catch((function(error) {
        throw new APIError('BACNetDeviceControllerDevice - stop: Socket Server - ' + error);
    }).bind(this))
    .then((function() {
        this.socketServer = null;
        return this.serviceManager.destroy();
    }).bind(this))
    .catch((function(error) {
        throw new APIError('BACNetDeviceControllerDevice - stop: Service Manager - ' + error);
    }).bind(this))
    .then((function() {
        this.serviceManager = null;
        return this.flowManager.destroy();
    }).bind(this))
    .catch((function(error) {
        throw new APIError('BACNetDeviceControllerDevice - stop: Flow Manager - ' + error);
    }).bind(this))
    .then((function() {
        this.flowManager = null;
    }).bind(this))
};

 /**
 * initDevice - initializes the device, sets initial state.
 *
 */
BACNetDevice.prototype.initDevice = function () {
    // Init the default state
    this.setState(this.state);

    this.state.initialized = false;

    this.config = this.configuration;

    if (!this.config) {
        throw new APIError('initDevice - Configuration is not defined!');
    }

    this.logger = this.createLogger();

    this.covObjectIds = [];

    this.subManager = new Managers.SubscriptionManager();
    this.subManager.initManager();

    // Inits specific internal properties
    this.logger.logDebug("BACNetDeviceControllerDevice - initDevice: "
        + "Inits specific internal properties");
    this.initDeviceParamsFromConfig();
    // Creates the config for the plugin components
    this.logger.logDebug("BACNetDeviceControllerDevice - initDevice: "
        + "Creates the config for the plugin components");
    
    return this.createPluginConfig().then((function(pluginConfig) {
        this.pluginConfig = pluginConfig;
        // Creates instances of the plugin componets
        this.logger.logDebug('BACNetDeviceControllerDevice - initDevice: '
            + 'Creates instances of the plugin componets');
        return this.createPluginComponents();
    }).bind(this))
    .then((function() {
        // Creates instance of the API Service
        this.logger.logDebug('BACNetDeviceControllerDevice - initDevice: '
            + 'Creates the instance of the API Service');
        this.apiService = this.serviceManager.createAPIService();

        // Creates 'subscribtion' to the BACnet 'whoIs' - 'iAm' flow
        this.logger.logDebug('BACNetDeviceControllerDevice - initDevice: '
            + 'Creates "subscribtion" to the BACnet "whoIs" - "iAm" flow');
        this.subscribeToObject();

        // Send 'WhoIs' request
        this.logger.logDebug('BACNetDeviceControllerDevice - initDevice: '
            + 'Send "WhoIs" request');
        if (this.config.unicastWhoIsConfirmation) {
            this.apiService.unconfirmedReq.whoIsUnicast({});
        } else {
            this.apiService.unconfirmedReq.whoIsBroadcast({});
        }

        this.state.initialized = true;
    }).bind(this))
};

/**
 * Creates and inits params of the BACnet Device from plugin configuration.
 * Steps:
 * - creates and inits 'objectId'.
 *
 * @return {void}
 */
BACNetDevice.prototype.initDeviceParamsFromConfig = function () {
    this.objectId = Helpers.BACnet.getBACnetObjectId(this.config.deviceId || 0, BACnet.Enums.ObjectType.Device);
};

/**
 * Creates the configuration for the plugin components.
 *
 * @return {Promise<Interfaces.AppConfig>}
 */
BACNetDevice.prototype.createPluginConfig = function () {
    // Gets device address information
    return this.getDeviceIpAddress()
        .then((function(ipAddress) {
            var port = this.getDevicePort();
            // Creates the config for the plugin components
            return _.merge({}, _.cloneDeep(Configs.AppConfig), {
                server: {
                    port: port,
                },
                manager: {
                    service: {
                        dest: {
                            address: ipAddress,
                        },
                    },
                },
            });
        }).bind(this))
};

/**
 * Creates string key for objectId.
 *
 * @return {Promise<void>}
 */
BACNetDevice.prototype.getObjectIdStringKey = function () {
    const deviceId = this.objectId.value.type + ':' + this.objectId.value.instance;
    console.log(deviceId);
    return deviceId;
}

/**
 * Creates instances of the plugin componets.
 *
 * @return {Promise<void>}
 */
BACNetDevice.prototype.createPluginComponents = function () {
    /* Create, init and start socket server */
    this.socketServer = new Sockets.ServerSocket(this.logger);
    this.socketServer.initServer(this.pluginConfig.server);
    return this.socketServer.startServer()
        .then((function() {
            var deviceId = this.getObjectIdStringKey();
            BACnetAction.setBACnetServer(deviceId, this.socketServer);

            /* Create and init BACnet Service Manager */
            this.serviceManager = new Managers.BACnetServiceManager(this.logger);
            this.serviceManager.initManager(this.pluginConfig.manager.service, this.config.priority, deviceId);
            BACnetAction.setBACnetServiceManager(deviceId, this.serviceManager);

            /* Create and init BACnet Flow Manager */
            this.flowManager = new Managers.BACnetFlowManager(this.logger, deviceId);
            this.flowManager.initManager(this.pluginConfig.manager.flow);
            BACnetAction.setBACnetFlowManager(deviceId, this.flowManager);
        }).bind(this))
};

/**
 * Creates 'subscribtion' to the BACnet 'whoIs' - 'iAm' flow.
 *
 * @return {void}
 */
BACNetDevice.prototype.subscribeToObject = function () {

    var destAddrInfo = this.pluginConfig.manager.service.dest;
    this.subManager.subscribe = this.flowManager.getResponseFlow()
        .pipe(
            RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
            RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.iAm)),
            RxOp.filter(Helpers.FlowFilter.matchFilter(this.config.deviceIdMatchRequired, 
                Helpers.FlowFilter.isBACnetObject(this.objectId), "device ID")),
            RxOp.filter(Helpers.FlowFilter.matchFilter(this.config.vendorIdMatchRequired, 
                Helpers.FlowFilter.isBACnetVendorId(this.config.vendorId), "vendor ID")),
            RxOp.filter(Helpers.FlowFilter.matchFilter(this.config.ipMatchRequired, 
                Helpers.FlowFilter.isBACnetIPAddress(destAddrInfo.address), "IP Address")),
            RxOp.timeout(Configs.AppConfig.response.iAm.timeout), RxOp.first()
        )
        .subscribe((function (resp) {
        // Handles 'iAm' response
        this.logger.logInfo('Initialized BACnet device successfully.');
        var iAmService = resp.layer.apdu.service;
        this.objectId = iAmService.objId;
        // Creates 'subscribtion' to the BACnet device properties
        this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToObject: "
            + "Creates \"subscribtion\" to the BACnet device properties");
        this.subscribeToProperty();
        var curAddrInfo = this.pluginConfig.manager.service.dest;
        var respAddrInfo = resp.socket.getAddressInfo();
        if (curAddrInfo.address !== respAddrInfo.address) {
            if (curAddrInfo.address.indexOf('GENERATED_') > -1) {
                this.logger.logInfo("BACNetDeviceControllerDevice - subscribeToObject: "
                    + ("Device IP not configured, found at " + respAddrInfo.address));
            }
            else {
                this.logger.logInfo("BACNetDeviceControllerDevice - subscribeToObject: "
                    + ("Device configured with " + curAddrInfo.address + " found at " + respAddrInfo.address));
            }
            // Sets IP from response to 'plugin' config
            this.pluginConfig = _.merge({}, _.cloneDeep(this.pluginConfig), 
            {
                manager: { 
                    service: { 
                        dest: { 
                            address: respAddrInfo.address 
                        } 
                    } 
                },
            });
            // Create new instance of the 'service' manager
            this.serviceManager.destroy();
            var deviceId = this.getObjectIdStringKey();
            this.serviceManager.initManager(this.pluginConfig.manager.service, this.config.priority, deviceId);
            BACnetAction.setBACnetServiceManager(deviceId, this.serviceManager);
            // Create new instance of the API service
            this.apiService.destroy().catch((function(error) {
                this.logger.logError(error);
            }).bind(this));
            
            this.apiService = this.serviceManager.createAPIService();
        }
        this.state.initialized = true;
        this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToObject: "
            + ("State - " + JSON.stringify(this.state)));
        // Inits the BACnet properties
        this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToObject: "
            + "Inits the BACnet properties");
        this.initProperties();
        // Call 'init' method each actor
        this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToObject: "
            + "Inits the TID units");
        var deviceId = this.getObjectIdStringKey();
        Bluebird.map(this.actors, function (actor) {
            return actor.initDevice(deviceId);
        }, { concurrency: 1 });
    }).bind(this), 
    (function (error) {
        this.logError("BACNetDeviceControllerDevice - subscribeToObject: " + error);
    }).bind(this));
};

/**
 * Inits the BACnet properties.
 *
 * @return {Promise<void>}
 */
BACNetDevice.prototype.initProperties = function () {
    
    // Gets the 'objectName' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.objectName);
    // Gets the 'description' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.description);
    // Gets the 'vendorName' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.vendorName);
    // Gets the 'modelName' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.modelName);
    // Gets the 'applicationSoftwareVersion' property
    this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.applicationSoftwareVersion);
};

/**
 * Creates 'subscribtion' to the BACnet device properties.
 *
 * @return {void}
 */
BACNetDevice.prototype.subscribeToProperty = function () {

    var readPropertyFlow = this.flowManager.getResponseFlow()
        .pipe(
            RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
            RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
            RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId))
        );
    // Gets the 'objectName' property
    var ovObjectName = readPropertyFlow
        .pipe(
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.objectName)),
            RxOp.map((function (resp) {
                var bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue(resp.layer);
                this.state.name = bacnetProperty.value;
                this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToProperty: "
                    + ("Object Name: " + this.state.name));
                this.publishStateChange();
            }).bind(this))
        );
    // Gets the 'description' property
    var ovDescription = readPropertyFlow
        .pipe(
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.description)), 
            RxOp.map((function (resp) {
                var bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue(resp.layer);
                this.state.description = bacnetProperty.value;
                this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToProperty: "
                    + ("Description: " + this.state.description));
                this.publishStateChange();
            }).bind(this))
        );
    // Gets the 'vendorName' property
    var ovVendorName = readPropertyFlow
        .pipe(
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.vendorName)),
            RxOp.map((function (resp) {
                var bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue(resp.layer);
                this.state.vendor = bacnetProperty.value;
                this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToProperty: "
                    + ("Vendor ID: " + this.state.vendor));
                this.publishStateChange();
            }).bind(this))
        );
    // Gets the 'modelName' property
    var ovModelName = readPropertyFlow
        .pipe(
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.modelName)),
            RxOp.map((function (resp) {
                var bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue(resp.layer);
                this.state.model = bacnetProperty.value;
                this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToProperty: "
                    + ("Model Name: " + this.state.model));
                this.publishStateChange();
            }).bind(this))
        );
    // Gets the 'applicationSoftwareVersion' property
    var ovSoftwareVersion = readPropertyFlow
        .pipe(
            RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.applicationSoftwareVersion)),
            RxOp.map((function (resp) {
                var bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue(resp.layer);
                this.state.softwareVersion = bacnetProperty.value;
                this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToProperty: "
                    + ("Software Version: " + this.state.softwareVersion));
                this.publishStateChange();
            }).bind(this))
        );
    // Gets the summary 'readProperty' response
    this.subManager.subscribe = Rx.combineLatest(ovObjectName, ovDescription, ovVendorName, 
            ovModelName, ovSoftwareVersion)
        .pipe(
            RxOp.timeout(Configs.AppConfig.response.readProperty.timeout),
            RxOp.first())
        .subscribe((function () {
        this.logger.logDebug('BACNetDeviceControllerDevice - subscribeToProperty: '
            + "Device properties were received");
        this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToProperty: "
            + ("BACnet Device details: " + JSON.stringify(this.state)));
    }).bind(this), 
    (function (error) {
        this.logger.logDebug("BACNetDeviceControllerDevice - subscribeToProperty: "
            + ("Device properties were not received " + error));
    }).bind(this));
};


/**
 * Extracts the 'presentValue' and 'statusFlags' of the BACnet Object from
 * the BACnet 'COVNotification' service.
 * @param  {IBACnetResponse} resp - response from BACnet Object (device)
 * @return {[T,BACnet.Types.BACnetStatusFlags]}
 */
BACNetDevice.prototype.getCOVNotificationValues = function (resp) {
    this.logger.logDebug("CommonDevice - getCOVNotificationValues: "
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
BACNetDevice.prototype.sendWriteProperty = function (objectId, propId, values) {
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
BACNetDevice.prototype.sendReadProperty = function (objectId, propId) {
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
BACNetDevice.prototype.sendSubscribeCOV = function (objectId) {
    var deviceId = this.getObjectIdStringKey();
    this.subManager.subscribe = store.select([ 'bacnet', deviceId, 'covTimer'])
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

BACNetDevice.prototype.getState = function () {
    this.logDebug('getState', this.state);
    return this.state;
};

/**
 *
 */
BACNetDevice.prototype.setState = function (state) {
    this.logDebug('setState', state);
    this.state = _.isObjectLike(state) ? _.cloneDeep(state) : {};
};

/**
 *
 */
BACNetDevice.prototype.update = function () {
    this.logDebug('Pushing current state.', this.state);
    this.publishStateChange();
    return Bluebird.resolve();
};

BACNetDevice.prototype.createLogger = function () {
    var logger = new Logger(this);
    logger.setLogMethod(Enums.LogLevel.Debug, this.logDebug);
    logger.setLogMethod(Enums.LogLevel.Error, this.logError);
    logger.setLogMethod(Enums.LogLevel.Info, this.logInfo);
    return logger;
};

/**
 * HELPERs
 */
/**
 * Calculates the 'IP' address of the BACnet device.
 *
 * @return {string} - 'IP' address of the BACnet device
 */
BACNetDevice.prototype.getDeviceIpAddress = function () {
    var _this = this;
    if (this.config.urlLookupRequired !== true
            || !_.isString(this.config.url) || !this.config.url) {
        // Get IP Address from config or Generate new IP Address
        var ipAddress = !_.isString(this.config.ipAddress) || !this.config.ipAddress
            ? "GENERATED_" + Math.round(Math.random() * 10000000)
            : this.config.ipAddress;
        this.logger.logDebug("BACNetDeviceControllerDevice - getDeviceIpAddress: "
            + ("IP address not configured, using \"" + ipAddress + "\""));
        return Bluebird.resolve(ipAddress);
    }
    return new Bluebird(function (resolve, reject) {
        // Get IP Address from DNS server by URL
        dns.lookup(_this.config.url, function (error, address, family) {
            if (error) {
                _this.logger.logDebug("BACNetDeviceControllerDevice - getDeviceIpAddress: "
                    + ("Error trying to look up URL \"" + _this.config.url + "\" " + error));
                return reject(error);
            }
            _this.logger.logDebug("BACNetDeviceControllerDevice - getDeviceIpAddress: "
                + ("Retrieved IP address \"" + address + "\" for URL \"" + _this.config.url + "\""));
            return resolve(address);
        });
    });
};

/**
 * Calculates the 'PORT' of the BACnet device.
 *
 * @return {number} - 'PORT' of the BACnet device
 */
BACNetDevice.prototype.getDevicePort = function () {
    var port = +this.config.port;
    if (port >= 1024 && port <= 65536) {
        return port;
    }
    this.logDebug("BACNetDeviceControllerDevice - getDevicePort: "
        + ("Configured port \"" + this.config.port + "\" is out of range (1024-65536). ")
        + ("Defaulting to port \"" + Configs.AppConfig.server.port + "\""));
    return Configs.AppConfig.server.port;
};
