import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import { APILightService } from '../../../core/services/light/light.service';

import {
    IRoomControlActorState,
    IRoomControlActorConfig,
} from '../../../core/interfaces';

export class ThermostatActorDevice extends ActorDevice {
    public readonly className: string = 'ThermostatActorDevice';
    protected apiService: APILightService;
    public state: IRoomControlActorState;
    public config: IRoomControlActorConfig;

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
    public incrementSetpoint (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public decrementSetpoint (presentValue: any): Bluebird<void> {
        return Bluebird.resolve();
    }
}
