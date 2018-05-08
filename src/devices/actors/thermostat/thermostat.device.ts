import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import * as Interfaces from '../../../core/interfaces';

export class ThermostatActorDevice extends ActorDevice {
    public readonly className: string = 'ThermostatActorDevice';
    public state: Interfaces.Actor.Thermostat.State;
    public config: Interfaces.Actor.Thermostat.Config;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.state.initialized = true;
        this.publishStateChange();
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
