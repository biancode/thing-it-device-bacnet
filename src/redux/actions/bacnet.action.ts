import { store } from '../index';
import { BACnetEvent } from '../events/bacnet.event';
import { IAction } from '../core/redux.interface';

import { BACnetFlowManager, BACnetServiceManager } from '../../core/managers';
import { ServerSocket } from '../../core/sockets';

export class BACnetAction {

    /**
     *  Sets the instance of the BACnet Flow Manager to `redux` store.
     *
     * @static
     * @param  {BACnetFlowManager} manager - instance of the BACnet Flow Manager
     * @return {IAction}
     */
    static setBACnetFlowManager (manager: BACnetFlowManager): IAction {
        return store.dispatch({
            type: BACnetEvent.setBACnetFlowManager,
            payload: { manager: manager },
        });
    }

    /**
     *  Sets the instance of the BACnet Service Manager to `redux` store.
     *
     * @static
     * @param  {BACnetServiceManager} manager - instance of the BACnet Service Manager
     * @return {IAction}
     */
    static setBACnetServiceManager (manager: BACnetServiceManager): IAction {
        return store.dispatch({
            type: BACnetEvent.setBACnetServiceManager,
            payload: { manager: manager },
        });
    }

    /**
     *  Sets the instance of the BACnet Server to `redux` store.
     *
     * @static
     * @param  {ServerSocket} server - instance of the BACnet Server
     * @return {IAction}
     */
    static setBACnetServer (server: ServerSocket): IAction {
        return store.dispatch({
            type: BACnetEvent.setBACnetServer,
            payload: { server: server },
        });
    }
}
