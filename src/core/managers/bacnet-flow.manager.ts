import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';

import * as BACnet from 'bacnet-logic';

import { APIError } from '../errors';

import { ServerSocket } from '../sockets';

import * as Interfaces from '../interfaces';

import { Logger } from '../utils';

import { store } from '../../redux';

type BACnetFlowFilter = (resp: Interfaces.FlowManager.Response) => boolean;

export class BACnetFlowManager {
    private config: Interfaces.FlowManager.Config;
    private errorFlow: Subject<Error>;
    private respFlow: Subject<Interfaces.FlowManager.Response>;
    private server: ServerSocket;

    constructor (private logger: Logger) {
    }

    /**
     * Destroys the instance.
     * - removes config (sets `null`)
     * - removes respFlow (sets `null`)
     * - destroys errorFlow (calls `unsubscribe` and sets `null`)
     *
     * @return {Promise<any>}
     */
    public async destroy (): Promise<any> {
        this.config = null;
        this.server = null;

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
     * initManager - sets the manager configuration, inits the "error" flow and
     * gets the "response" flow from BACnet server.
     *
     * @param {Interfaces.FlowManager.Config} config - manager configuration
     * @return {void}
     */
    public initManager (config: Interfaces.FlowManager.Config): void {
        this.config = config;

        this.respFlow = new Subject();
        this.errorFlow = new Subject();

        this.server = store.getState([ 'bacnet', 'bacnetServer' ]);

        this.server.respFlow
            .subscribe((resp) => {
                let layer: BACnet.Interfaces.Layers;

                this.logger.logDebug(`BACnetFlowManager - getResponseFlow: `
                    + `Response Message: ${resp.message.toString('hex')}`);

                try {
                    layer = BACnet.Helpers.Layer.bufferToLayer(resp.message);
                    this.respFlow.next({ layer: layer, socket: resp.socket });

                    // this.logger.logDebug(`BACnetFlowManager - getResponseFlow: `
                    //     + `Response Layer: ${JSON.stringify(layer)}`);
                } catch (error) {
                    this.errorFlow.next(error);

                    this.logger.logError(`BACnetFlowManager - getResponseFlow: `
                        + `Response Error: ${error}`);
                }
            });
    }

    /**
     * getErrorFlow - returns "observable" for "error" flow.
     *
     * @return {Observable<Error>}
     */
    public getErrorFlow (): Observable<Error> {
        return this.errorFlow;
    }

    /**
     * getResponseFlow - returns "observable" for "response" flow.
     *
     * @return {Observable<Interfaces.FlowManager.Response>}
     */
    public getResponseFlow (): Observable<Interfaces.FlowManager.Response> {
        return this.respFlow;
    }
}
