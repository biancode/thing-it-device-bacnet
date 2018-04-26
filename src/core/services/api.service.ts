import * as _ from 'lodash';

import * as APIBACnetServices from './bacnet';

export class APIService {

    private _confirmedReq: APIBACnetServices.APIConfirmedReqService;

    /**
     * Set instance of ConfirmedReq API Service. If service already exist, method
     * will skip "set" operation.
     *
     * @type {apiService}
     */
    public set confirmedReq (service: APIBACnetServices.APIConfirmedReqService) {
        if (!_.isNil(this._confirmedReq)) {
            return;
        }
        this._confirmedReq = service;
    }

    /**
     * Return instance of ConfirmedReq API Service.
     *
     * @type {apiService}
     */
    public get confirmedReq (): APIBACnetServices.APIConfirmedReqService {
        return this._confirmedReq;
    }

    private _unconfirmedReq: APIBACnetServices.APIUnconfirmedReqService;

    /**
     * Set instance of UnconfirmedReq API Service. If service already exist, method
     * will skip "set" operation.
     *
     * @type {apiService}
     */
    public set unconfirmedReq (service: APIBACnetServices.APIUnconfirmedReqService) {
        if (!_.isNil(this._unconfirmedReq)) {
            return;
        }
        this._unconfirmedReq = service;
    }

    /**
     * Return instance of UnconfirmedReq API Service.
     *
     * @type {apiService}
     */
    public get unconfirmedReq (): APIBACnetServices.APIUnconfirmedReqService {
        return this._unconfirmedReq;
    }
}
