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
                    layer = BACnet.Utils.BACnetUtil.bufferToLayer(resp.message);
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

    /**
     * FILTERs
     */

    /**
     * Creates filter for flow, compares the BACnet service types.
     * Branches:
     * - If service type does not exist in response, filter will return "false".
     * - If service type from response do not equal to service type from arguments,
     * filter will return "false".
     * - If service type from response equal to service type from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isServiceType (serviceType: BACnet.Enums.ServiceType): BACnetFlowFilter {
        return (resp: Interfaces.FlowManager.Response): boolean => {
            const respServiceType = _.get(resp, 'layer.apdu.type', null);
            return !_.isNil(respServiceType) && respServiceType === serviceType;
        };
    }

    /**
     * Creates filter for flow, compares the BACnet service choices.
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
        return (resp: Interfaces.FlowManager.Response): boolean => {
            const respServiceChoice = _.get(resp, 'layer.apdu.serviceChoice', null);
            return !_.isNil(respServiceChoice) && respServiceChoice === serviceChoice;
        };
    }

    /**
     * Creates filter for flow, compares the BACnet object IDs.
     * Branches:
     * - If object identifier does not exist in response, filter will return "false".
     * - If object identifier from response do not equal to object identifier from arguments,
     * filter will return "false".
     * - If object identifier from response equal to object identifier from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isBACnetObject (objId: BACnet.Types.BACnetObjectId): BACnetFlowFilter {
        return (resp: Interfaces.FlowManager.Response): boolean => {
            const respObjId: BACnet.Types.BACnetObjectId =
                _.get(resp, 'layer.apdu.service.objId', null);
            return !_.isNil(respObjId) && respObjId.isEqual(objId);
        };
    }

    /**
     * Creates filter for flow, compares the BACnet property IDs.
     * Branches:
     * - If property identifier does not exist in response, filter will return "false".
     * - If property identifier from response do not equal to property identifier from arguments,
     * filter will return "false".
     * - If property identifier from response equal to property identifier from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isBACnetProperty (propId: BACnet.Enums.PropertyId): BACnetFlowFilter {
        return (resp: Interfaces.FlowManager.Response): boolean => {
            const respPropId: BACnet.Types.BACnetEnumerated =
                _.get(resp, 'layer.apdu.service.prop.id', null);
            return !_.isNil(respPropId) && respPropId.isEqual(propId);
        };
    }

    /**
     * Creates filter for flow, compares the BACnet vendor IDs.
     * Branches:
     * - If vendor identifier does not exist in response, filter will return "false".
     * - If vendor identifier from response do not equal to vendor identifier from arguments,
     * filter will return "false".
     * - If vendor identifier from response equal to vendor identifier from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isBACnetVendorId (vendorId: number): BACnetFlowFilter {
        return (resp: Interfaces.FlowManager.Response): boolean => {
            const respVendorId: BACnet.Types.BACnetUnsignedInteger =
                _.get(resp, 'layer.apdu.service.vendorId', null);
            return !_.isNil(respVendorId) && respVendorId.isEqual(vendorId);
        };
    }

    /**
     * Creates filter for flow, compares the BACnet device IP address.
     * Branches:
     * - If IP address does not exist in response, filter will return "false".
     * - If IP address from response do not equal to IP address from arguments,
     * filter will return "false".
     * - If IP address from response equal to IP address from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public isBACnetIPAddress (ipAddress: string): BACnetFlowFilter {
        return (resp: Interfaces.FlowManager.Response): boolean => {
            const respAddrInfo = resp.socket.getAddressInfo();
            return respAddrInfo.address === ipAddress;
        };
    }

    /**
     * Creates filter for flow, compares the BACnet device IP address.
     * Branches:
     * - If IP address does not exist in response, filter will return "false".
     * - If IP address from response do not equal to IP address from arguments,
     * filter will return "false".
     * - If IP address from response equal to IP address from arguments,
     * filter will return "true".
     *
     * @return {BACnetFlowFilter}
     */
    public matchFilter (isRequired: boolean, filterFn: BACnetFlowFilter,
            matchName: string = 'object'): BACnetFlowFilter {
        return (resp: Interfaces.FlowManager.Response): boolean => {
            if (!isRequired || filterFn(resp)) {
                return true;
            }

            const respAddrInfo = resp.socket.getAddressInfo();
            this.logger.logDebug(`BACnetFlowManager - matchFilter(${respAddrInfo.address}:${respAddrInfo.port}):`,
                `Responding ${matchName} is not a match to configured ${matchName}.`);
            return false;
        };
    }
}
