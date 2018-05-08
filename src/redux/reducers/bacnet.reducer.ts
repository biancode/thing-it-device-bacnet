import * as _ from 'lodash';
import * as moment from 'moment';

import { Reducer } from 'redux';
import { IAction } from '../core/redux.interface';
import * as BACnetEvent from '../events/bacnet.event';

import * as Managers from '../../core/managers';
import { ServerSocket } from '../../core/sockets';

import { COVTimer } from '../../core/entities';

export interface IBACnetState {
    flowManager: Managers.BACnetFlowManager;
    serviceManager: Managers.BACnetServiceManager;
    bacnetServer: ServerSocket;
    covTimer: COVTimer;
}

export const BACnetInitialState: IBACnetState = {
    flowManager: null,
    serviceManager: null,
    bacnetServer: null,
    covTimer: null,
};

export const BACnetReducer: Reducer<IBACnetState> =
        (state = BACnetInitialState, action: IAction): IBACnetState => {
    switch (action.type) {
        case BACnetEvent.setBACnetFlowManager: {
            const flowManager: Managers.BACnetFlowManager = action.payload.manager;
            return _.assign({}, state, { flowManager });
        }
        case BACnetEvent.setBACnetServiceManager: {
            const serviceManager: Managers.BACnetServiceManager = action.payload.manager;
            return _.assign({}, state, { serviceManager });
        }
        case BACnetEvent.setBACnetServer: {
            const bacnetServer: ServerSocket = action.payload.server;
            return _.assign({}, state, { bacnetServer });
        }
        case BACnetEvent.tickCOVTimer: {
            const covTimer: COVTimer = action.payload.covTimer;
            return _.assign({}, state, { covTimer });
        }
    }
    return state;
};
