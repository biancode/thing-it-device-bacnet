import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { createStore, Store, Reducer } from 'redux';

import { IAction } from './redux.interface';

export class AppStore <RootState> {
    private dataFlow: BehaviorSubject<RootState>;
    private store: Store<RootState, any>;

    constructor (reducer: Reducer<RootState, any>, initialState: RootState) {
        this.store = createStore(reducer, <any>initialState);

        const reduxState = this.getState();
        this.dataFlow = new BehaviorSubject(reduxState);

        this.store.subscribe(() => {
            const newState = this.getState();
            this.dataFlow.next(newState);
        });
    }

    /**
     * Dispatches an action.
     *
     * @param  {IAction} action - storage action
     * @return {IAction}
     */
    public dispatch (action: IAction): IAction {
        return this.store.dispatch<IAction>(action);
    }

    /**
     * Returns the current state of application (redux store).
     *
     * @return {RootState}
     */
    public getStore (): RootState {
        return this.store.getState();
    }

    /**
     * Selects the value from redux store by specific selector.
     *
     * @param  {string[]|string} selector - store selector (path)
     * @return {Observable<T>}
     */
    public select <T> (selector: string[]|string): Observable<T> {
        const selectorFixed = selector ? selector : '';
        const selectorArray = _.isArray(selectorFixed)
            ? selectorFixed : [selectorFixed];
        const selectorPath = selectorArray.join('.');

        return this.dataFlow
            .pipe(
                distinctUntilChanged(),
                map<RootState, T>((state: RootState) => {
                    return _.get(state, selectorPath);
                }),
                distinctUntilChanged(),
            );
    }
}
