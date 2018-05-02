import * as _ from 'lodash';
import { Observable, Subject } from 'rxjs';

import { ILayer } from '../bacnet/interfaces';
import { BACnetUtil } from '../bacnet/utils';
import * as BACnetTypes from '../bacnet/types';
import { BACnetServiceTypes, BACnetPropertyId } from '../bacnet/enums';

import { ApiError } from '../errors';

import { ServerSocket } from '../sockets';

import {
    IBACnetResponse,
    IBACnetFlowManagerConfig,
} from '../interfaces';

import { Logger } from '../utils';

import { store } from '../../redux';

type BACnetFlowFilter = (resp: IBACnetResponse) => boolean;

export class BACnetFlowManager {
    private config: IBACnetFlowManagerConfig;
    private errorFlow: Subject<Error>;
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
            this.errorFlow.unsubscribe();
        } catch (error) {
            throw new ApiError(`BACnetFlowManager - destroy: ${error}`);
        }
        finally {
            this.errorFlow = null;
        }
    }

    /**
     * initManager - sets the manager configuration, inits the "error" flow and
     * gets the "response" flow from BACnet server.
     *
     * @return {void}
     */
    public initManager (config: IBACnetFlowManagerConfig): void {
        this.config = config;

        this.errorFlow = new Subject();

        this.server = store.getState([ 'bacnet', 'bacnetServer' ]);
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
     * @return {Observable<IBACnetResponse>}
     */
    public getResponseFlow (): Observable<IBACnetResponse> {
        return this.server.respFlow
            .map((resp) => {
                let layer: ILayer;
                try {
                    layer = BACnetUtil.bufferToLayer(resp.message);
                } catch (error) {
                    this.errorFlow.next(error);
                }
                return { layer: layer, socket: resp.socket };
            });
    }

    /**
     * FILTERs
     */

    /**
     * isServiceType - creates filter for flow, compares the BACnet service types.
     * Branches:
     * - If service type does not exist in response, filter will return "false".
     * - If service type from response do not equal to service type from arguments,
     * filter will return "false".
     * - If service type from response equal to service type from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isServiceType (serviceType: BACnetServiceTypes): BACnetFlowFilter {
        return (resp: IBACnetResponse): boolean => {
            const respServiceType = _.get(resp, 'layer.apdu.type', null);
            return !_.isNil(respServiceType) && respServiceType === serviceType;
        };
    }

    /**
     * isServiceChoice - creates filter for flow, compares the BACnet service choices.
     * Branches:
     * - If service choice does not exist in response, filter will return "false".
     * - If service choice from response do not equal to service choice from arguments,
     * filter will return "false".
     * - If service choice from response equal to service choice from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isServiceChoice (serviceChoice: any): BACnetFlowFilter {
        return (resp: IBACnetResponse): boolean => {
            const respServiceChoice = _.get(resp, 'layer.apdu.serviceChoice', null);
            return !_.isNil(respServiceChoice) && respServiceChoice === serviceChoice;
        };
    }

    /**
     * isBACnetObject - creates filter for flow, compares the BACnet objects.
     * Branches:
     * - If object identifier does not exist in response, filter will return "false".
     * - If object identifier from response do not equal to object identifier from arguments,
     * filter will return "false".
     * - If object identifier from response equal to object identifier from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isBACnetObject (objId: BACnetTypes.BACnetObjectId): BACnetFlowFilter {
        return (resp: IBACnetResponse): boolean => {
            const respObjId: BACnetTypes.BACnetObjectId =
                _.get(resp, 'layer.apdu.service.objId', null);
            return !_.isNil(respObjId) && respObjId.isEqual(objId);
        };
    }

    /**
     * isBACnetObject - creates filter for flow, compares the BACnet objects.
     * Branches:
     * - If object identifier does not exist in response, filter will return "false".
     * - If object identifier from response do not equal to object identifier from arguments,
     * filter will return "false".
     * - If object identifier from response equal to object identifier from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isBACnetProperty (propId: BACnetPropertyId): BACnetFlowFilter {
        return (resp: IBACnetResponse): boolean => {
            const respPropId: BACnetTypes.BACnetUnsignedInteger =
                _.get(resp, 'layer.apdu.service.propId', null);
            return !_.isNil(respPropId) && respPropId.isEqual(propId);
        };
    }
}
