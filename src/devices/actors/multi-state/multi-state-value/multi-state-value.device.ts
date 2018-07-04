import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as BACnet from 'tid-bacnet-logic';

import { MultiStateActorDevice } from '../multi-state.device';

import * as Interfaces from '../../../../core/interfaces';

import * as Entities from '../../../../core/entities';

import * as Helpers from '../../../../core/helpers';

import * as Errors from '../../../../core/errors';

export class MultiStateValueActorDevice extends MultiStateActorDevice {
    public readonly className: string = 'MultiStateValueActorDevice';
    public state: Interfaces.Actor.MultiStateValue.State;
    public config: Interfaces.Actor.MultiStateValue.Config;

    /**
     * Creates and inits params of the BACnet Analog Value from plugin configuration.
     * Steps:
     * - creates and inits `objectId`.
     *
     * @return {void}
     */
    public initParamsFromConfig (): void {
        this.objectId = Helpers.BACnet.getBACnetObjectId(
            this.config.objectId,
            BACnet.Enums.ObjectType.MultiStateValue,
        );
    }

    /**
     * TID API Methods
     */

    /**
     * Service Stub
     */
    public setPresentValue (presentValue: number): Bluebird<void> {
        this.logger.logDebug('MultiStateValueActorDevice - setPresentValue: Called setPresentValue()');

        this.sendWriteProperty(this.objectId, BACnet.Enums.PropertyId.presentValue,
            [ new BACnet.Types.BACnetUnsignedInteger(presentValue) ]);

        return Bluebird.resolve();
    }
}
