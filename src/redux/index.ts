import { AppStore } from './core/app.store';

/* Store Interfaces */
import {
    IStoreState,
    StoreReducer,
    StoreInitialState
} from './reducers';

export const store = new AppStore<IStoreState>(StoreReducer, StoreInitialState);
