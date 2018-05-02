import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ApiError } from '../../../core/errors';

/* Plugin devices */
import { ControllerDevice } from '../controller.device';

import {
    BACnetAppManager,
    BACnetFlowManager,
    BACnetServiceManager,
} from '../../../core/managers';

import {
    BACnetObjectType,
    BACnetServiceTypes,
    BACnetUnconfirmedService,
} from '../../../core/bacnet/enums';

import * as BACnetTypes from '../../../core/bacnet/types';

import {
    IBACnetDeviceControllerState,
    IBACnetDeviceControllerConfig
} from '../../../core/interfaces';

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

        return this.initDevice();
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
        /* Create, init and start socket server */
        const socketServer = new ServerSocket();
        socketServer.initServer(config.server);
        console.log('asdas');
        await socketServer.startServer();
        BACnetAction.setBACnetServer(socketServer);

        /* Create and init BACnet Service Manager */
        const serviceManager = new BACnetServiceManager();
        serviceManager.initManager({ server: socketServer });
        BACnetAction.setBACnetServiceManager(serviceManager);

        /* Create and init BACnet Flow Manager */
        const flowManager = new BACnetFlowManager();
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
}
