import * as dns from 'dns';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import { combineLatest } from 'rxjs/observable/combineLatest';

import { ControllerDevice } from '../controller.device';

/* Plugin devices */
import { BACnetAction } from '../../../redux/actions';

import { ApiError } from '../../../core/errors';

import { AppConfig } from '../../../core/configs';

import { ServerSocket } from '../../../core/sockets';

import {
    BACnetFlowManager,
    BACnetServiceManager,
} from '../../../core/managers';

import {
    APIService,
} from '../../../core/services';

import {
    IBACnetDeviceControllerState,
    IBACnetDeviceControllerConfig,
    IBACnetResponse,
    IAppConfig,
} from '../../../core/interfaces';

import {
    BACnetObjectType,
    BACnetPropertyId,
    BACnetServiceTypes,
    BACnetUnconfirmedService,
    BACnetConfirmedService,
} from '../../../core/bacnet/enums';

import {
    ILayerComplexACKServiceReadProperty,
} from '../../../core/bacnet/interfaces';

import * as BACnetTypes from '../../../core/bacnet/types';

export class BACnetDeviceControllerDevice extends ControllerDevice {
    public state: IBACnetDeviceControllerState;
    public config: IBACnetDeviceControllerConfig;

    public pluginConfig: IAppConfig;

    public socketServer: ServerSocket;
    public flowManager: BACnetFlowManager;
    public serviceManager: BACnetServiceManager;
    public apiService: APIService;

    private objectId: BACnetTypes.BACnetObjectId;

    public start () {
        super.start();

        let initResult: Promise<any>;
        try {
            initResult = this.initDevice();
        } catch (error) {
            this.logError(`BACnetDeviceController - start: ${error}`);
        }

        return initResult;
    }

    public stop () {
        super.stop();

        try {
            this.socketServer.destroy();
        } catch (error) {
            throw new ApiError(`BACnetDeviceControllerDevice - stop: Socket Server - ${error}`);
        }
        finally {
            this.socketServer = null;
        }

        try {
            this.serviceManager.destroy();
        } catch (error) {
            throw new ApiError(`BACnetDeviceControllerDevice - stop: Service Manager - ${error}`);
        }
        finally {
            this.serviceManager = null;
        }

        try {
            this.flowManager.destroy();
        } catch (error) {
            throw new ApiError(`BACnetDeviceControllerDevice - stop: Flow Manager - ${error}`);
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

        // Step 1. Inits specific internal properties
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Inits specific internal properties`);
        this.initDeviceParamsFromConfig();

        // Step 2. Creates the config for the plugin components
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates the config for the plugin components`);
        this.pluginConfig = await this.createPluginConfig();

        // Step 3. Creates instances of the plugin componets
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates instances of the plugin componets`);
        await this.createPluginComponents();

        // Step 4. Creates instance of the API Service
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates the instance of the API Service`);
        this.apiService = this.serviceManager.createAPIService();

        // Step 5. Creates `subscribtion` to the BACnet `whoIs` - `iAm` flow
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates "subscribtion" to the BACnet "whoIs" - "iAm" flow`);
        this.subscribeToObject();

        // Step 6. Creates `subscribtion` to the BACnet device properties
        this.logger.logDebug(`BACnetDeviceControllerDevice - initDevice: `
            + `Creates "subscribtion" to the BACnet device properties`);
        this.subscribeToProperty();

        // Step 7. Send `WhoIs` request
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
     * Step 1. Creates and inits params of the BACnet Device from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initDeviceParamsFromConfig (): void {
        this.objectId = new BACnetTypes.BACnetObjectId({
            type: BACnetObjectType.Device,
            instance: this.config.deviceId,
        });
    }

    /**
     * Step 2. Creates the configuration for the plugin components.
     *
     * @return {Promise<IAppConfig>}
     */
    public async createPluginConfig (): Promise<IAppConfig> {
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
                        port: port,
                    },
                },
            },
        });
    }

    /**
     * Step 3. Creates instances of the plugin componets.
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
        this.serviceManager = new BACnetServiceManager(this.logger);
        this.serviceManager.initManager(this.pluginConfig.manager.service);
        BACnetAction.setBACnetServiceManager(this.serviceManager);

        /* Create and init BACnet Flow Manager */
        this.flowManager = new BACnetFlowManager(this.logger);
        this.flowManager.initManager(this.pluginConfig.manager.flow);
        BACnetAction.setBACnetFlowManager(this.flowManager);
    }

    /**
     * Step 5. Creates `subscribtion` to the BACnet `whoIs` - `iAm` flow.
     *
     * @return {void}
     */
    public subscribeToObject (): void {
        const destAddrInfo = this.pluginConfig.manager.service.dest;

        this.subManager.subscribe = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnetServiceTypes.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnetUnconfirmedService.iAm))
            .filter(this.flowManager.matchFilter(this.config.deviceIdMatchRequired,
                this.flowManager.isBACnetObject(this.objectId), `device ID`))
            .filter(this.flowManager.matchFilter(this.config.vendorIdMatchRequired,
                this.flowManager.isBACnetVendorId(this.config.vendorId), `vendor ID`))
            .filter(this.flowManager.matchFilter(this.config.ipMatchRequired,
                this.flowManager.isBACnetIPAddress(destAddrInfo.address), `IP Address`))
            .timeout(AppConfig.response.iAm.timeout)
            .first()
            .subscribe((resp) => {
                // Step 8. Handles `iAm` response
                this.logger.logInfo('Initialized BACnet device successfully.');
                const curAddrInfo = this.pluginConfig.manager.service.dest;
                const respAddrInfo = resp.socket.getAddressInfo();

                if (curAddrInfo.address !== respAddrInfo.address) {
                    if (curAddrInfo.address.indexOf('GENERATED_') > -1) {
                        this.logger.logInfo(`BACnetDeviceControllerDevice - subscribeToObject: `
                            + `Device ID not configured, found at ${respAddrInfo.address}`);
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
                    // Create new instance of the API service
                    this.apiService.destroy();
                    this.apiService = this.serviceManager.createAPIService();
                }

                this.state.initialized = true;
                this.logger.logDebug(`State: ${this.state}`);

                // Step 9. Call `init` method each actor
                Bluebird.map(this.actors, (actor) => {
                    return actor.initDevice();
                }, { concurrency: 1 });

                // Step 10. Inits the BACnet properties
                this.initProperties();
            }, (error) => {
                this.logError(`BACnetDeviceControllerDevice - subscribeToObject: ${error}`);
            });
    }

    /**
     * Step 6. Creates `subscribtion` to the BACnet device properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnetServiceTypes.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnetConfirmedService.ReadProperty))
            .filter(this.flowManager.isBACnetObject(this.objectId));

        // Gets the `objectName` property
        const ovObjectName = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.objectName))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.name = bacnetProperty.value;
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `Name retrieved: ${this.state.name}`);
            });

        // Gets the `description` property
        const ovDescription = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.description))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.description = bacnetProperty.value;
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `Description retrieved: ${this.state.description}`);
            });

        // Gets the `vendorName` property
        const ovVendorName = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.vendorName))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.vendor = bacnetProperty.value;
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `Vendor retrieved: ${this.state.vendor}`);
            });

        // Gets the `modelName` property
        const ovModelName = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.modelName))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.model = bacnetProperty.value;
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `Model retrieved: ${this.state.model}`);
            });

        // Gets the `applicationSoftwareVersion` property
        const ovSoftwareVersion = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.applicationSoftwareVersion))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.softwareVersion = bacnetProperty.value;
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `Software retrieved: ${this.state.softwareVersion}`);
            });

        // Gets the summary `readProperty` response
        this.subManager.subscribe = combineLatest(ovObjectName, ovDescription, ovVendorName,
                ovModelName, ovSoftwareVersion)
            .timeout(AppConfig.response.readProperty.timeout)
            .first()
            .subscribe(() => {
                this.logger.logDebug('BACnetDeviceControllerDevice - subscribeToProperty: '
                    + `Device properties were received`);
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `BACnet Device details: ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            }, (error) => {
                this.logger.logDebug(`BACnetDeviceControllerDevice - subscribeToProperty: `
                    + `Device properties were not received`);
                this.publishStateChange();
            });
    }

    /**
     * Step 10. Inits the BACnet properties.
     *
     * @return {Promise<void>}
     */
    public async initProperties (): Promise<void> {
        // Gets the `objectName` property
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            unitObjId: this.objectId,
            unitProp: {
                id: BACnetPropertyId.objectName,
            },
        });

        // Gets the `description` property
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            unitObjId: this.objectId,
            unitProp: {
                id: BACnetPropertyId.description,
            },
        });

        // Gets the `vendorName` property
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            unitObjId: this.objectId,
            unitProp: {
                id: BACnetPropertyId.vendorName,
            },
        });

        // Gets the `modelName` property
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            unitObjId: this.objectId,
            unitProp: {
                id: BACnetPropertyId.modelName,
            },
        });

        // Gets the `applicationSoftwareVersion` property
        this.apiService.confirmedReq.readProperty({
            invokeId: 1,
            unitObjId: this.objectId,
            unitProp: {
                id: BACnetPropertyId.applicationSoftwareVersion,
            },
        });
    }

    /**
     * HELPERs
     */

    /**
     * Extracts the value of the property from BACnet `ReadProperty` service.
     *
     * @param  {IBACnetResponse} resp - response from BACnet Object (device)
     * @return {BACnetTypes.BACnetCharacterString}
     */
    private getReadPropertyString (resp: IBACnetResponse): BACnetTypes.BACnetCharacterString {
        const respServiceData: ILayerComplexACKServiceReadProperty =
            _.get(resp, 'layer.apdu.service', null);

        const bacnetProperty = respServiceData.prop.values[0] as
            BACnetTypes.BACnetCharacterString;
        return bacnetProperty;
    }

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

        if (port >= 1024 || port <= 65536) {
            return port;
        }

        this.logDebug(`BACnetDeviceControllerDevice - getDevicePort: `
            + `Configured port "${this.config.port}" is out of range (1024-65536). `
            + `Defaulting to port "${AppConfig.server.port}"`);
        return AppConfig.server.port;
    }
}
