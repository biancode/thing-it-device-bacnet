import * as _ from 'lodash';
import { Reducer } from 'redux';
import { IAction } from '../core/redux.interface';
import { BACnetEvent } from '../events/bacnet.event';

export interface IBACnetState {
    config: any;
}

export const BACnetInitialState: IBACnetState = {
    config: null,
};

export const BACnetReducer: Reducer<IBACnetState> =
        (state = BACnetInitialState, action: IAction): IBACnetState => {
    switch (action.type) {
        case BACnetEvent.setConfig: {
            return _.assign({}, state, {
                config: action.payload.data,
            });
        }
    }
    return state;
};
