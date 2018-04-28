import * as _ from 'lodash';
import { Reducer } from 'redux';
import { IAction } from '../core/redux.interface';
import { BACnetEvent } from '../events/bacnet.event';

import { BACnetFlowManager, BACnetServiceManager } from '../../core/managers';
import { ServerSocket } from '../../core/sockets';

export interface IBACnetState {
    flowManager: BACnetFlowManager;
    serviceManager: BACnetServiceManager;
    bacnetServer: ServerSocket;
}

export const BACnetInitialState: IBACnetState = {
    flowManager: null,
    serviceManager: null,
    bacnetServer: null,
};

export const BACnetReducer: Reducer<IBACnetState> =
        (state = BACnetInitialState, action: IAction): IBACnetState => {
    switch (action.type) {
        case BACnetEvent.setBACnetFlowManager: {
            const flowManager: BACnetFlowManager = action.payload.manager;
            return _.assign({}, state, { flowManager });
        }
        case BACnetEvent.setBACnetServiceManager: {
            const serviceManager: BACnetServiceManager = action.payload.manager;
            return _.assign({}, state, { serviceManager });
        }
        case BACnetEvent.setBACnetServer: {
            const bacnetServer: BACnetServiceManager = action.payload.server;
            return _.assign({}, state, { bacnetServer });
        }
    }
    return state;
};
