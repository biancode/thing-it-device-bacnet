import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as Rx from 'rxjs';

import * as Errors from '../errors';

import * as Interfaces from '../interfaces';

import * as Entities from '../entities';

type TObjectID = string;

export class SequenceManager {
    private config: Interfaces.SequenceManager.Config;

    private flows: Map<TObjectID, Entities.Flow<Interfaces.SequenceManager.Handler>>;
    private state: Rx.BehaviorSubject<Interfaces.SequenceManager.State>;

    constructor () {
    }

    /**
     * initManager - inits internal data flow storages, data flow subject and
     * data flow subscription.
     *
     * @return {void}
     */
    public initManager (config: Interfaces.SequenceManager.Config): void {
        this.config = config;

        this.flows = new Map();

        this.state = new Rx.BehaviorSubject({
            free: true,
        });
    }

    /**
     * next - emits new "value" for sequence data flow.
     *
     * @param  {string} flowId - flow ID
     * @param  {Interfaces.SequenceManager.FlowHandler} flowHandler - flow handler
     * @return {void}
     */
    public next (flowId: string, flowHandler: Interfaces.SequenceManager.Handler): void {
        let flow = this.flows.get(flowId);

        if (_.isNil(flow)) {
            flow = new Entities.Flow<Interfaces.SequenceManager.Handler>();
        }

        flow.add(flowHandler);

        this.flows.set(flowId, flow);

        this.updateQueue(flowId);
    }

    /**
     * destroy - unsubscribes from the data flow.
     *
     * @return {void}
     */
    public async destroy (): Promise<void> {
        await this.state
            .filter((state) => !_.isNil(state) && state.free)
            .first()
            .toPromise();

        this.flows.clear();
        this.flows = null;
    }

    /**
     * updateQueue - handles the changes of data flow.
     *
     * @param  {Interfaces.SequenceManager.FlowHandler} flow - data flow
     * @return {void}
     */
    private updateQueue (flowId: string): void {
        this.updateState();

        let flow = this.flows.get(flowId);

        if (flow.isFree() || flow.active >= this.config.thread) {
            return;
        }
        const flowHandler = flow.hold();

        let endPromise;
        try {
            endPromise = flowHandler.method.apply(flowHandler.object, flowHandler.params);
        } catch (error) {
            throw new Errors.APIError(`SequenceManager - updateQueue: ${error}`);
        }

        Bluebird.resolve(endPromise)
            .delay(this.config.delay).then(() => {
                flow.release();
                this.updateQueue(flowId);
            });
    }

    /**
     * Updates the state of the `Sequence` manager.
     *
     * @return {void}
     */
    private updateState (): void {
        let free = true;

        this.flows.forEach((flow) => {
            free = free && flow.isFree();
        })

        this.state.next({
            free: free,
        });
    }
}
