import * as _ from 'lodash';
import { Observable } from 'rxjs';

import { ServerSocket } from '../sockets';

import { config } from '../configs';

import { IBACnetResponse } from '../interfaces';

import { ILayer } from '../bacnet/interfaces';
import { BACnetUtil } from '../bacnet/utils';

import * as BACnetTypes from '../bacnet/types';
import { BACnetServiceTypes } from '../bacnet/enums';

type RespFlowFilter = (resp: IBACnetResponse) => boolean;

export class BACnetManager {
    private socketServer: ServerSocket;

    public async initManager (): Promise<void> {
        this.socketServer = new ServerSocket();
        this.socketServer.initServer(config.server);
        await this.socketServer.startServer();
    }

    public getResponseFlow (): Observable<IBACnetResponse> {
        return this.socketServer.respFlow
            .map((resp) => {
                let layer: ILayer;
                try {
                    layer = BACnetUtil.bufferToLayer(resp.message);
                } catch (error) {
                    ;
                }
                return { layer: layer, server: resp };
            });
    }

    public isServiceType (serviceType: BACnetServiceTypes): RespFlowFilter {
        return (resp: IBACnetResponse): boolean => {
            const respServiceType = _.get(resp, 'layer.apdu.type');
            return respServiceType === serviceType;
        };
    }

    public isServiceChoice (serviceChoice: any): RespFlowFilter {
        return (resp: IBACnetResponse): boolean => {
            const respServiceChoice = _.get(resp, 'layer.apdu.serviceChoice');
            return respServiceChoice === serviceChoice;
        };
    }

    public isBACnetObject (objId: BACnetTypes.BACnetObjectId): RespFlowFilter {
        return (resp: IBACnetResponse): boolean => {
            const respObjId: BACnetTypes.BACnetObjectId =
                _.get(resp, 'layer.apdu.service.objId');
            return !_.isNil(respObjId) && BACnetUtil.isEqualObjectId(objId, respObjId);
        };
    }
}
