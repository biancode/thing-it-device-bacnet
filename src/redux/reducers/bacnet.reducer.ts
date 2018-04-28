import * as _ from 'lodash';
import { Reducer } from 'redux';
import { IAction } from '../core/redux.interface';
import { BACnetEvent } from '../events/bacnet.event';

import { BACnetFlowManager, BACnetServiceManager } from '../../core/managers';

export interface IBACnetState {
    flowManager: BACnetFlowManager;
    serviceManager: BACnetServiceManager;
}

export const BACnetInitialState: IBACnetState = {
    flowManager: null,
    serviceManager: null,
};

export const BACnetReducer: Reducer<IBACnetState> =
        (state = BACnetInitialState, action: IAction): IBACnetState => {
    switch (action.type) {
        case BACnetEvent.setBACnetFlowManager: {
            const flowManager: BACnetFlowManager = action.payload.manager;
            return _.assign({}, state, {
                flowManager: flowManager,
            });
        }
        case BACnetEvent.setBACnetServiceManager: {
            const serviceManager: BACnetServiceManager = action.payload.manager;
            return _.assign({}, state, {
                serviceManager: serviceManager,
            });
        }
    }
    return state;
};
