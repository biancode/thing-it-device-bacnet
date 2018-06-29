import * as dns from 'dns';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import * as Rx from 'rxjs';
import * as RxOp from 'rxjs/operators';

import * as BACnet from 'bacnet-logic';

import { ControllerDevice } from '../controller.device';

/* Plugin devices */
import { BACnetAction } from '../../../redux/actions';

import { APIError } from '../../../core/errors';

import { AppConfig } from '../../../core/configs';

import { ServerSocket } from '../../../core/sockets';

import * as Managers from '../../../core/managers';

import { APIService } from '../../../core/services';

import * as Interfaces from '../../../core/interfaces';

import * as Helpers from '../../../core/helpers';

export class BACnetDeviceControllerDevice extends ControllerDevice {
    public state: Interfaces.Controller.BACnetDevice.State;
    public config: Interfaces.Controller.BACnetDevice.Config;

    public pluginConfig: Interfaces.AppConfig;

    public socketServer: ServerSocket;
    public flowManager: Managers.BACnetFlowManager;
    public serviceManager: Managers.BACnetServiceManager;
    public apiService: APIService;

    private objectId: BACnet.Types.BACnetObjectId;

    public start () {
        super.start();

        Bluebird.map(this.actors, (actor) => {
            return actor.initSubManager();
        }, { concurrency: 1 });

        let initResult: Promise<any>;

        try {
            initResult = this.initDevice();
        } catch (error) {
            this.logError(`BACnetDeviceController - start: ${error}`);
        }

        return initResult;
    }

    public async stop (): Promise<void> {
        super.stop();

        try {
            await this.socketServer.destroy();
        } catch (error) {
            throw new APIError(`BACnetDeviceControllerDevice - stop: Socket Server - ${error}`);
        }
        finally {
            this.socketServer = null;
        }

        try {
            await this.serviceManager.destroy();
        } catch (error) {
            throw new APIError(`BACnetDeviceControllerDevice - stop: Service Manager - ${error}`);
        }
        finally {
            this.serviceManager = null;
        }

        try {
            await this.flowManager.destroy();
        } catch (error) {
            throw new APIError(`BACnetDeviceControllerDevice - stop: Flow Manager - ${error}`);
        }
        finally {
            this.flowManager = null;
        }
    }

    /**
     * Inits the BACnet controller.
     *
     * @return {Promise<any>}
     */
    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.covObjectIds = [];

        this.subManager = new Managers.SubscriptionManager();
        await this.subManager.initManager();

        // Inits specific internal properties
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Inits specific internal properties`);
        this.initDeviceParamsFromConfig();

        // Creates the config for the plugin components
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates the config for the plugin components`);
        this.pluginConfig = await this.createPluginConfig();

        // Creates instances of the plugin componets
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates instances of the plugin componets`);
        await this.createPluginComponents();

        // Creates instance of the API Service
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates the instance of the API Service`);
        this.apiService = this.serviceManager.createAPIService();

        // Creates `subscribtion` to the BACnet `whoIs` - `iAm` flow
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates "subscribtion" to the BACnet "whoIs" - "iAm" flow`);
        this.subscribeToObject();

        // Send `WhoIs` request
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Send "WhoIs" request`);
        if (this.config.unicastWhoIsConfirmation) {
            this.apiService.unconfirmedReq.whoIsUnicast({});
        } else {
            this.apiService.unconfirmedReq.whoIsBroadcast({});
        }

        this.state.initialized = true;
    }

    /**
     * Creates and inits params of the BACnet Device from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initDeviceParamsFromConfig (): void {
        this.objectId = Helpers.BACnet.getBACnetObjectId(
            this.config.deviceId || 0,
            BACnet.Enums.ObjectType.Device,
        );
    }

    /**
     * Creates the configuration for the plugin components.
     *
     * @return {Promise<Interfaces.AppConfig>}
     */
    public async createPluginConfig (): Promise<Interfaces.AppConfig> {
        // Gets device address information
        const ipAddress = await this.getDeviceIpAddress();
        const port = this.getDevicePort();

        // Creates the config for the plugin components
        return _.merge({}, _.cloneDeep(AppConfig), {
            server: {
                port: port,
            },
            manager: {
                service: {
                    dest: {
                        address: ipAddress,
                        port: 47807,
                    },
                },
            },
        });
    }

    /**
     * Creates instances of the plugin componets.
     *
     * @return {Promise<void>}
     */
    public async createPluginComponents (): Promise<void> {
        /* Create, init and start socket server */
        this.socketServer = new ServerSocket(this.logger);
        this.socketServer.initServer(this.pluginConfig.server);
        await this.socketServer.startServer();
        BACnetAction.setBACnetServer(this.socketServer);

        /* Create and init BACnet Service Manager */
        this.serviceManager = new Managers.BACnetServiceManager(this.logger);
        this.serviceManager.initManager(this.pluginConfig.manager.service);
        BACnetAction.setBACnetServiceManager(this.serviceManager);

        /* Create and init BACnet Flow Manager */
        this.flowManager = new Managers.BACnetFlowManager(this.logger);
        this.flowManager.initManager(this.pluginConfig.manager.flow);
        BACnetAction.setBACnetFlowManager(this.flowManager);
    }

    /**
     * Creates `subscribtion` to the BACnet `whoIs` - `iAm` flow.
     *
     * @return {void}
     */
    public subscribeToObject (): void {
        const destAddrInfo = this.pluginConfig.manager.service.dest;

        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.UnconfirmedReqPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.UnconfirmedServiceChoice.iAm)),
                RxOp.filter(Helpers.FlowFilter.matchFilter(this.config.deviceIdMatchRequired,
                    Helpers.FlowFilter.isBACnetObject(this.objectId), `device ID`)),
                RxOp.filter(Helpers.FlowFilter.matchFilter(this.config.vendorIdMatchRequired,
                    Helpers.FlowFilter.isBACnetVendorId(this.config.vendorId), `vendor ID`)),
                RxOp.filter(Helpers.FlowFilter.matchFilter(this.config.ipMatchRequired,
                    Helpers.FlowFilter.isBACnetIPAddress(destAddrInfo.address), `IP Address`)),
                RxOp.timeout(AppConfig.response.iAm.timeout),
                RxOp.first(),
            )
            .subscribe((resp) => {
                // Handles `iAm` response
                this.logger.logInfo('Initialized BACnet device successfully.');

                const iAmService = resp.layer.apdu.service as BACnet.Interfaces.UnconfirmedRequest.Read.IAm;
                this.objectId = iAmService.objId;

                // Creates `subscribtion` to the BACnet device properties
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToObject: `
                    + `Creates "subscribtion" to the BACnet device properties`);
                this.subscribeToProperty();

                const curAddrInfo = this.pluginConfig.manager.service.dest;
                const respAddrInfo = resp.socket.getAddressInfo();

                if (curAddrInfo.address !== respAddrInfo.address) {
                    if (curAddrInfo.address.indexOf('GENERATED_') > -1) {
                        this.logger.logInfo(`BACnetDeviceControllerDevice - subscribeToObject: `
                            + `Device IP not configured, found at ${respAddrInfo.address}`);
                    } else {
                        this.logger.logInfo(`BACnetDeviceControllerDevice - subscribeToObject: `
                            + `Device configured with ${curAddrInfo.address} found at ${respAddrInfo.address}`);
                    }

                    // Sets IP from response to `plugin` config
                    this.pluginConfig = _.merge({}, _.cloneDeep(this.pluginConfig), {
                        manager: { service: { dest: { address: respAddrInfo.address } } },
                    });

                    // Create new instance of the `service` manager
                    this.serviceManager.destroy();
                    this.serviceManager.initManager(this.pluginConfig.manager.service);
                    BACnetAction.setBACnetServiceManager(this.serviceManager);
                    // Create new instance of the API service
                    this.apiService.destroy();
                    this.apiService = this.serviceManager.createAPIService();
                }

                this.state.initialized = true;
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToObject: `
                    + `State - ${JSON.stringify(this.state)}`);

                // Inits the BACnet properties
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToObject: `
                    + `Inits the BACnet properties`);
                this.initProperties();

                // Call `init` method each actor
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToObject: `
                    + `Inits the TID units`);
                Bluebird.map(this.actors, (actor) => {
                    return actor.initDevice();
                }, { concurrency: 1 });
            }, (error) => {
                this.logError(`BACnetDeviceControllerDevice - subscribeToObject: ${error}`);
            });
    }

    /**
     * Creates `subscribtion` to the BACnet device properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isServiceType(BACnet.Enums.ServiceType.ComplexACKPDU)),
                RxOp.filter(Helpers.FlowFilter.isServiceChoice(BACnet.Enums.ConfirmedServiceChoice.ReadProperty)),
                RxOp.filter(Helpers.FlowFilter.isBACnetObject(this.objectId)),
            );

        // Gets the `objectName` property
        const ovObjectName = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.objectName)),
                RxOp.map((resp) => {
                    const bacnetProperty = BACnet.Helpers.Layer
                    .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                    this.state.name = bacnetProperty.value;

                    this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                        + `Object Name: ${this.state.name}`);
                        this.publishStateChange();
                }),
            );

        // Gets the `description` property
        const ovDescription = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.description)),
                RxOp.map((resp) => {
                    const bacnetProperty = BACnet.Helpers.Layer
                        .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                    this.state.description = bacnetProperty.value;

                    this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                        + `Description: ${this.state.description}`);
                    this.publishStateChange();
                }),
            );

        // Gets the `vendorName` property
        const ovVendorName = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.vendorName)),
                RxOp.map((resp) => {
                    const bacnetProperty = BACnet.Helpers.Layer
                        .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                    this.state.vendor = bacnetProperty.value;

                    this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                        + `Vendor ID: ${this.state.vendor}`);
                    this.publishStateChange();
                }),
            );

        // Gets the `modelName` property
        const ovModelName = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.modelName)),
                RxOp.map((resp) => {
                    const bacnetProperty = BACnet.Helpers.Layer
                        .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                    this.state.model = bacnetProperty.value;

                    this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                        + `Model Name: ${this.state.model}`);
                    this.publishStateChange();
                }),
            );

        // Gets the `applicationSoftwareVersion` property
        const ovSoftwareVersion = readPropertyFlow
            .pipe(
                RxOp.filter(Helpers.FlowFilter.isBACnetProperty(BACnet.Enums.PropertyId.applicationSoftwareVersion)),
                RxOp.map((resp) => {
                    const bacnetProperty = BACnet.Helpers.Layer
                        .getPropertyValue<BACnet.Types.BACnetCharacterString>(resp.layer);

                    this.state.softwareVersion = bacnetProperty.value;

                    this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                        + `Software Version: ${this.state.softwareVersion}`);
                    this.publishStateChange();
                }),
            );

        // Gets the summary `readProperty` response
        this.subManager.subscribe = Rx.combineLatest(ovObjectName, ovDescription, ovVendorName,
                ovModelName, ovSoftwareVersion)
            .pipe(
                RxOp.timeout(AppConfig.response.readProperty.timeout),
                RxOp.first(),
            )
            .subscribe(() => {
                this.logger.logDebug('BACnetDeviceControllerDevice - subscribeToProperty: '
                    + `Device properties were received`);
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `BACnet Device details: ${JSON.stringify(this.state)}`);
            }, (error) => {
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `Device properties were not received ${error}`);
            });
    }

    /**
     * Inits the BACnet properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `objectName` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.objectName);

        // Gets the `description` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.description);

        // Gets the `vendorName` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.vendorName);

        // Gets the `modelName` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.modelName);

        // Gets the `applicationSoftwareVersion` property
        this.sendReadProperty(this.objectId, BACnet.Enums.PropertyId.applicationSoftwareVersion);
    }

    /**
     * HELPERs
     */

    /**
     * Calculates the `IP` address of the BACnet device.
     *
     * @return {string} - `IP` address of the BACnet device
     */
    public getDeviceIpAddress (): Bluebird<string> {
        if (this.config.urlLookupRequired !== true
                || !_.isString(this.config.url) || !this.config.url) {
            // Get IP Address from config or Generate new IP Address
            const ipAddress: string = !_.isString(this.config.ipAddress) || !this.config.ipAddress
                ? `GENERATED_${Math.round(Math.random() * 10000000)}`
                : this.config.ipAddress;

            this.logger.logDebug(`BACnetDeviceControllerDevice - getDeviceIpAddress: `
                + `IP address not configured, using "${ipAddress}"`);
            return Bluebird.resolve(ipAddress);
        }

        return new Bluebird((resolve, reject) => {
            // Get IP Address from DNS server by URL
            dns.lookup(this.config.url, (error, address, family) => {
                if (error) {
                    this.logger.logDebug(`BACnetDeviceControllerDevice - getDeviceIpAddress: `
                        + `Error trying to look up URL "${this.config.url}" ${error}`);
                    return reject(error);
                }

                this.logger.logDebug(`BACnetDeviceControllerDevice - getDeviceIpAddress: `
                    + `Retrieved IP address "${address}" for URL "${this.config.url}"`);
                return resolve(address);
            });
        });
    }

    /**
     * Calculates the `PORT` of the BACnet device.
     *
     * @return {number} - `PORT` of the BACnet device
     */
    public getDevicePort (): number {
        const port = +this.config.port;

        if (port >= 1024 && port <= 65536) {
            return port;
        }

        this.logDebug(`BACnetDeviceControllerDevice - getDevicePort: `
            + `Configured port "${this.config.port}" is out of range (1024-65536). `
            + `Defaulting to port "${AppConfig.server.port}"`);
        return AppConfig.server.port;
    }
}
