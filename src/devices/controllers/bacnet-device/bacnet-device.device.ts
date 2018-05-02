import * as dns from 'dns';
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ControllerDevice } from '../controller.device';

/* Plugin devices */
import { BACnetAction } from '../../../redux/actions';

import { ApiError } from '../../../core/errors';

import { config } from '../../../core/configs';

import { ServerSocket } from '../../../core/sockets';

import {
    BACnetFlowManager,
    BACnetServiceManager,
} from '../../../core/managers';

import {
    IBACnetDeviceControllerState,
    IBACnetDeviceControllerConfig,
    IBACnetResponse,
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

    public appManager: BACnetAppManager;
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

        this.state.initialized = true;
    }

    /**
     * createAppManager - creates instance of the BACnet Application Manager.
     *
     * @return {BACnetAppManager}
     */
    public async createAppManager (): Promise<any> {
        const logger = this.createLogger();

        /* Create, init and start socket server */
        const socketServer = new ServerSocket(logger);
        socketServer.initServer(config.server);
        await socketServer.startServer();
        this.socketServer = socketServer;
        BACnetAction.setBACnetServer(socketServer);

        /* Create and init BACnet Service Manager */
        const serviceManager = new BACnetServiceManager(logger);
        serviceManager.initManager({ server: socketServer });
        BACnetAction.setBACnetServiceManager(serviceManager);

        /* Create and init BACnet Flow Manager */
        const flowManager = new BACnetFlowManager(logger);
        flowManager.initManager({ server: socketServer });
        this.flowManager = flowManager;
        BACnetAction.setBACnetFlowManager(flowManager);
    }

    /**
     * initDeviceParamsFromConfig - creates and inits params of the BACnet Device
     * from plugin configuration.
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
     * Calculates the `IP` address of the BACnet device.
     *
     * @return {string} - `IP` address of the BACnet device
     */
    public getIp (): Bluebird<string> {
        if (this.config.urlLookupRequired !== true
                || !_.isString(this.config.url) || !this.config.url) {
            // Get IP Address from config or Generate new IP Address
            const ipAddress: string = !_.isString(this.config.ipAddress) || !this.config.ipAddress
                ? `GENERATED_${Math.round(Math.random() * 10000000)}`
                : this.config.ipAddress;

            this.logDebug(`IP address not configured, using ${this.config.ipAddress}`);
            return Bluebird.resolve(ipAddress);
        }

        return new Bluebird((resolve, reject) => {
            // Get IP Address from DNS server by URL
            dns.lookup(this.config.url, (error, address, family) => {
                if (error) {
                    this.logDebug(`Error trying to look up URL "${this.config.url}"`, error);
                    return reject(error);
                }

                this.config.ipAddress = address;

                this.logDebug(`Retrieved IP address for URL. ${address} ${this.config.url}`);
                return resolve(address);
            });
        });
    }
}
