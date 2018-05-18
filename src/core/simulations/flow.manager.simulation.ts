import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';

import * as BACnet from 'bacnet-logic';

import { APIError } from '../errors';

import { ServerSocket } from '../sockets';

import * as Interfaces from '../interfaces';

import * as Enums from '../enums';

import { Logger } from '../utils';

import { store } from '../../redux';

type BACnetFlowFilter = (resp: Interfaces.FlowManager.Response) => boolean;

export class BACnetFlowManager {
    private config: Interfaces.FlowManager.Config;
    private errorFlow: Subject<Error>;
    private respFlow: Subject<Interfaces.FlowManager.Response>;

    constructor (private logger: Logger) {
    }

    /**
     * Destroys the instance.
     * - removes config (sets `null`)
     * - destroys respFlow (calls `unsubscribe` and sets `null`)
     * - destroys errorFlow (calls `unsubscribe` and sets `null`)
     *
     * @return {Promise<any>}
     */
    public async destroy (): Promise<any> {
        this.config = null;

        try {
            this.respFlow.unsubscribe();
        } catch (error) {
            throw new APIError(`BACnetFlowManager - destroy: Response Flow - ${error}`);
        }
        finally {
            this.respFlow = null;
        }

        try {
            this.errorFlow.unsubscribe();
        } catch (error) {
            throw new APIError(`BACnetFlowManager - destroy: Error Flow - ${error}`);
        }
        finally {
            this.errorFlow = null;
        }
    }

    /**
     * Sets the manager configuration, inits the "error" flow and "response" flow.
     *
     * @param {Interfaces.FlowManager.Config} config - manager configuration
     * @return {void}
     */
    public initManager (config: Interfaces.FlowManager.Config): void {
        this.config = config;

        this.respFlow = new Subject();
        this.errorFlow = new Subject();
    }

    /**
     * Returns "observable" for "error" flow.
     *
     * @return {Observable<Error>}
     */
    public getErrorFlow (): Observable<Error> {
        return this.errorFlow;
    }

    /**
     * Returns "observable" for "response" flow.
     *
     * @return {Observable<Interfaces.FlowManager.Response>}
     */
    public getResponseFlow (): Observable<Interfaces.FlowManager.Response> {
        return this.respFlow;
    }

    /**
     * Emits the `event` with payload to a specific flow.
     *
     * @param  {Enums.Simulation.FlowType} flowType - type of the flow
     * @param  {BACnet.Interfaces.Layers|Error} data - data for the flow
     * @return {void}
     */
    public next (flowType: Enums.Simulation.FlowType, data: BACnet.Interfaces.Layers|Error): void {
        let flow: Subject<any>;

        switch (flowType) {
            case Enums.Simulation.FlowType.Error:
                const error = data as Error;
                this.errorFlow.next(error);
                break;
            case Enums.Simulation.FlowType.Response:
                const layer = data as BACnet.Interfaces.Layers;
                this.respFlow.next({ layer: layer, socket: null });
                break;
        }
    }
}
