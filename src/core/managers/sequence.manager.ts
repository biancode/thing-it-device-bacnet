import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { Subject, Subscription } from 'rxjs';

import {
    APIError,
} from '../errors';

import * as Interfaces from '../interfaces';

import {
    logger,
} from '../utils';

type TObjectID = string;

export class SequenceManager {
    private config: Interfaces.SequenceManager.Config;
    private sjDataFlow: Subject<Interfaces.SequenceManager.Flow>;
    private subDataFlow: Subscription;

    private freeFlows: Map<TObjectID, Interfaces.SequenceManager.Flow[]>;
    private busyFlows: Map<TObjectID, number>;

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

        this.freeFlows = new Map();
        this.busyFlows = new Map();

        this.sjDataFlow = new Subject();

        this.subDataFlow = this.sjDataFlow.subscribe((flow) => {
            if (!this.busyFlows.has(flow.id)) {
                this.busyFlows.set(flow.id, 0);
                this.freeFlows.set(flow.id, []);
            }

            const freeFlows = this.freeFlows.get(flow.id);
            freeFlows.push(flow);

            this.updateQueue(flow);
        });
    }

    /**
     * next - emits new "value" for sequence data flow.
     *
     * @param  {ISequenceFlow} data - value for sequence data flow
     * @return {void}
     */
    public next (data: Interfaces.SequenceManager.Flow): void {
        return this.sjDataFlow.next(data);
    }

    /**
     * destroy - unsubscribes from the data flow.
     *
     * @return {void}
     */
    public destroy (): void {
        try {
            this.freeFlows.clear();
            this.freeFlows = null;

            this.busyFlows.clear();
            this.busyFlows = null;

            this.sjDataFlow.complete();
            this.sjDataFlow = null;

            this.subDataFlow.unsubscribe();
        } catch (error) { ; }
    }

    /**
     * updateQueue - handles the changes of data flow.
     *
     * @param  {Interfaces.SequenceManager.Flow} flow - data flow
     * @return {void}
     */
    private updateQueue (flow: Interfaces.SequenceManager.Flow): void {
        const busyFlows = this.busyFlows.get(flow.id);
        const freeFlows = this.freeFlows.get(flow.id);

        if (busyFlows >= this.config.thread || !freeFlows.length) {
            return;
        }
        this.busyFlows.set(flow.id, busyFlows + 1);

        const freeFlow = freeFlows.shift();

        let endPromise;
        try {
            endPromise = freeFlow.method.apply(freeFlow.object, freeFlow.params);
        } catch (error) {
            logger.error(`SequenceManager - updateQueue: ${error}`);
        }

        Bluebird.resolve(endPromise).delay(this.config.delay).then(() => {
            this.busyFlows.set(flow.id, busyFlows);
            this.updateQueue(flow);
        });
    }
}
