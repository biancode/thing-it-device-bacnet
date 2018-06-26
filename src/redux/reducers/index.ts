import * as redux from 'redux';

/* Store Interfaces */
import {
    IBACnetState,
    BACnetReducer,
    BACnetInitialState
} from './bacnet.reducer';

/* Store Interface */
export interface IStoreState {
    bacnet: IBACnetState;
}

/* Store Initial State */
export const StoreInitialState: IStoreState = {
    bacnet: BACnetInitialState,
};

/* Combine State Reducers */
export const StoreReducer = redux.combineReducers<IStoreState>({
    bacnet: BACnetReducer,
});
