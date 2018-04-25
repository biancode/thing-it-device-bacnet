import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import { APILightService } from '../../../core/services/light/light.service';

import {
    IAnalogValueActorState,
    IAnalogValueActorConfig,
} from '../../../core/interfaces';

export class AnalogValueActorDevice extends ActorDevice {
    public readonly className: string = 'AnalogValueActorDevice';
    protected apiService: APILightService;
    public state: IAnalogValueActorState;
    public config: IAnalogValueActorConfig;

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

    /**
     * Service Stub
     */
    public setPresentValue (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public changeValue (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
