import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import { APILightService } from '../../../core/services/light/light.service';

import {
    IMultiStateInputActorState,
    IMultiStateInputActorConfig,
} from '../../../core/interfaces';

export class MultiStateInputActorDevice extends ActorDevice {
    public readonly className: string = 'MultiStateInputActorDevice';
    protected apiService: APILightService;
    public state: IMultiStateInputActorState;
    public config: IMultiStateInputActorConfig;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * setAPIService - gets the API service from "ServiceManager" and sets this
     * service in "apiService" property.
     *
     * @return {void}
     */
    public setAPIService (): void {
        this.apiService = this.serviceManager.getService('light') as APILightService;
    }

    /**
     * Service Stub
     */
    public update (): Bluebird<void> {
        return Bluebird.resolve();
    }
}