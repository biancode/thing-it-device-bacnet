import * as _ from 'lodash';
import { Observable } from 'rxjs';

import { ServerSocket } from '../sockets';

import { config } from '../configs';

/* Managers */
import { BACnetFlowManager } from './bacnet-flow.manager';
import { BACnetServiceManager } from './bacnet-service.manager';

export class BACnetAppManager {
    private socketServer: ServerSocket;

    private _serviceManager: BACnetServiceManager;

    /**
     * Return instance of the BACnet Service Manager
     *
     * @type {BACnetServiceManager}
     */
    public get serviceManager (): BACnetServiceManager {
        return this._serviceManager;
    }

    private _flowManager: BACnetFlowManager;

    /**
     * Return instance of the BACnet Flow Manager
     *
     * @type {BACnetFlowManager}
     */
    public get flowManager (): BACnetFlowManager {
        return this._flowManager;
    }

    /**
     * initManager - inits the BACnet Application Manager.
     * Steps:
     * - creates, inits and starts the instance of Socket Server.
     * - creates and inits BACnet Service Manager.
     * - creates and inits BACnet Flow Manager.
     *
     * @async
     * @return {Promise<void>}
     */
    public async initManager (): Promise<void> {
        /* Create, init and start socket server */
        this.socketServer = new ServerSocket();
        this.socketServer.initServer(config.server);
        await this.socketServer.startServer();

        /* Create and init BACnet Service Manager */
        this._serviceManager = new BACnetServiceManager();
        this._serviceManager.initManager({ server: this.socketServer });

        /* Create and init BACnet Flow Manager */
        this._flowManager = new BACnetFlowManager();
        this._flowManager.initManager({ server: this.socketServer });
    }
}
