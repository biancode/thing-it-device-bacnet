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
     * initDevice - inits the Philips controller.
     * - Method creates the API Light service and registrate created
     * service in "ServiceManager".
     *
     * @return {Promise<any>}
     */
    public async initDevice (): Promise<any> {
        await super.initDevice();

        // Step 1. Inits specific internal properties
        this.initDeviceParamsFromConfig();

        // Step 2. Creates config for the each component
        this.pluginConfig = await this.createPluginConfig();

        // Step 3. Creates instances of managers
        await this.createPluginComponents();

        // Step 4. Creates instance of the API Service
        const apiService = this.serviceManager.createAPIService();

        // Step 5. Creates `subscribtion` to the BACnet `whoIs` - `iAm` flow
        this.subscribeToObject();

        // Step 6. Creates `subscribtion` to the BACnet device properties
        this.subscribeToProperty();

        // Step 7. Send `WhoIs` request
        if (this.config.unicastWhoIsConfirmation === true) {
            apiService.unconfirmedReq.whoIsUnicast({});
        } else {
            apiService.unconfirmedReq.whoIsBroadcast({});
        }

        // Call `init` method in each actor
        const actors = this.actors;
        for (let i = 0; i < actors.length; i++) {
            await actors[i].initDevice();
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
     * Step 2. Creates the configuration for the each plugin component.
     *
     * @return {Promise<IAppConfig>}
     */
    public async createPluginConfig (): Promise<IAppConfig> {
        // Gets device address information
        const ipAddress = await this.getDeviceIpAddress();
        const port = this.getDevicePort();

        // Creates the config for each plugin components
        return _.assign({}, _.cloneDeep(AppConfig), {
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
     * Step 3. Creates the instance of the each plugin componet.
     *
     * @return {Promise<void>}
     */
    public async createPluginComponents (): Promise<void> {
        /* Create, init and start socket server */
        const socketServer = new ServerSocket(this.logger);
        socketServer.initServer(this.pluginConfig.server);
        await socketServer.startServer();
        this.socketServer = socketServer;
        BACnetAction.setBACnetServer(socketServer);

        /* Create and init BACnet Service Manager */
        const serviceManager = new BACnetServiceManager(this.logger);
        serviceManager.initManager(this.pluginConfig.manager.service);
        BACnetAction.setBACnetServiceManager(serviceManager);

        /* Create and init BACnet Flow Manager */
        const flowManager = new BACnetFlowManager(this.logger);
        flowManager.initManager(this.pluginConfig.manager.flow);
        this.flowManager = flowManager;
        BACnetAction.setBACnetFlowManager(flowManager);
    }

    /**
     * Step 4. Creates `subscribtion` to the BACnet `whoIs` - `iAm` flow.
     *
     * @return {void}
     */
    public subscribeToObject (): void {
        const destAddrInfo = this.pluginConfig.manager.service.dest;

        this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnetServiceTypes.UnconfirmedReqPDU))
            .filter(this.flowManager.isServiceChoice(BACnetUnconfirmedService.iAm))
            .filter(this.flowManager.matchFilter(this.config.deviceIdMatchRequired,
                this.flowManager.isBACnetObject(this.objectId), `device ID`))
            .filter(this.flowManager.matchFilter(this.config.vendorIdMatchRequired,
                this.flowManager.isBACnetVendorId(this.config.vendorId), `vendor ID`))
            .filter(this.flowManager.matchFilter(this.config.ipMatchRequired,
                this.flowManager.isBACnetIPAddress(destAddrInfo.address), `IP Address`))
            .timeout(AppConfig.whoIsTimeout)
            .subscribe(() => { this.initProperties(); });
    }

    /**
     * Step 5. Creates `subscribtion` to the BACnet device properties.
     *
     * @return {void}
     */
    public subscribeToProperty (): void {
        const readPropertyFlow = this.flowManager.getResponseFlow()
            .filter(this.flowManager.isServiceType(BACnetServiceTypes.ComplexACKPDU))
            .filter(this.flowManager.isServiceChoice(BACnetConfirmedService.ReadProperty))
            .filter(this.flowManager.isBACnetObject(this.objectId));

        const ovObjectName = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.objectName))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.name = bacnetProperty.value;
                this.logger.logDebug(`Name retrieved: ${this.state.name}`);
            });

        const ovDescription = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.description))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.description = bacnetProperty.value;
                this.logger.logDebug(`Description retrieved: ${this.state.description}`);
            });

        const ovVendorName = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.vendorName))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.vendor = bacnetProperty.value;
                this.logger.logDebug(`Vendor retrieved: ${this.state.vendor}`);
            });

        const ovModelName = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.modelName))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.model = bacnetProperty.value;
                this.logger.logDebug(`Model retrieved: ${this.state.model}`);
            });

        const ovSoftwareVersion = readPropertyFlow
            .filter(this.flowManager.isBACnetProperty(BACnetPropertyId.applicationSoftwareVersion))
            .map((resp) => {
                const bacnetProperty = this.getReadPropertyString(resp);

                this.state.softwareVersion = bacnetProperty.value;
                this.logger.logDebug(`Software retrieved: ${this.state.softwareVersion}`);
            });

        combineLatest(ovObjectName, ovDescription, ovVendorName,
                ovModelName, ovSoftwareVersion)
            .first()
            .subscribe(() => {
                this.logger.logDebug('Device data retrieved.');
                this.logger.logDebug(`BACnet Device details: ${JSON.stringify(this.state)}`);
                this.publishStateChange();
            });
    }

    /**
     * Step 9. Inits the BACnet properties.
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

        const bacnetProperty = respServiceData.propValues[0] as
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

            this.logger.logDebug(`IP address not configured, using ${this.config.ipAddress}`);
            return Bluebird.resolve(ipAddress);
        }

        return new Bluebird((resolve, reject) => {
            // Get IP Address from DNS server by URL
            dns.lookup(this.config.url, (error, address, family) => {
                if (error) {
                    this.logger.logDebug(`Error trying to look up URL "${this.config.url}" ${error}`);
                    return reject(error);
                }

                this.logger.logDebug(`Retrieved IP address for URL. ${address} ${this.config.url}`);
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

        this.logDebug(`Configured port "${this.config.port}" is out of range (1024-65536). `
            + `Defaulting to port ${AppConfig.server.port}.`);
        return AppConfig.server.port;
    }
}
