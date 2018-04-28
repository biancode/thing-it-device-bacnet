import { combineReducers } from 'redux';

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
export const StoreReducer = combineReducers<IStoreState>({
    bacnet: BACnetReducer,
});
