import * as _ from 'lodash';
import * as Bluebird from 'bluebird';

import { ActorDevice } from '../actor.device';

import {
    IJalousieSimpleActorState,
    IJalousieSimpleActorConfig,
} from '../../../core/interfaces';

export class JalousieSimpleActorDevice extends ActorDevice {
    public readonly className: string = 'JalousieSimpleActorDevice';
    public state: IJalousieSimpleActorState;
    public config: IJalousieSimpleActorConfig;

    public async initDevice (): Promise<any> {
        await super.initDevice();

        this.state.initialized = true;
        this.publishStateChange();
    }

    /**
     * Service Stub
     */
    public raisePosition (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public lowerPosition (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public positionUp (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public positionDown (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public openBlade (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public closeBlade (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public stopMotion (): Bluebird<void> {
        return Bluebird.resolve();
    }

    /**
     * Service Stub
     */
    public update (): Bluebird<void> {
        return Bluebird.resolve();
    }
}
