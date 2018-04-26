import * as _ from 'lodash';
import { Observable } from 'rxjs';

import { ServerSocket } from '../sockets';

import { config } from '../configs';

/* Managers */
import { BACnetFlowManager } from './bacnet-flow.manager';
import { BACnetServiceManager } from './bacnet-service.manager';

export class BACnetAppManager {
    private socketServer: ServerSocket;
    private serviceManager: BACnetServiceManager;
    private flowManager: BACnetFlowManager;

    public async initManager (): Promise<void> {
        /* Create, init and start socket server */
        this.socketServer = new ServerSocket();
        this.socketServer.initServer(config.server);
        await this.socketServer.startServer();

        /* Create and init BACnet Service Manager */
        this.serviceManager = new BACnetServiceManager();
        this.serviceManager.initManager({ server: this.socketServer });

        /* Create and init BACnet Flow Manager */
        this.flowManager = new BACnetFlowManager();
        this.flowManager.initManager({ server: this.socketServer });
    }
}
