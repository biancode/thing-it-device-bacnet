import * as Bluebird from 'bluebird';
import * as _ from 'lodash';

import * as request from 'request';
import * as requestPromise from 'request-promise';

import {
    RESTOptions,
    RESTRequestCallback,
    RESTRequest,
} from '../interfaces';

export class RESTClient {
    private req: request.RequestAPI<request.Request,
        request.CoreOptions, request.RequiredUriUrl>;
    private reqPromise: request.RequestAPI<requestPromise.RequestPromise,
        requestPromise.RequestPromiseOptions, request.RequiredUriUrl>;

    constructor () {
        this.req = request;
        this.reqPromise = requestPromise;
    }

    /**
     * request - sends the REST request..
     *
     * @param  {RESTClient} opts - REST options
     * @return {any} - response
     */
    public request (opts: RESTOptions, fn: RESTRequestCallback): RESTRequest {
        return this.req(opts, fn);
    }

    /**
     * request - sends the REST request..
     *
     * @param  {RESTClient} opts - REST options
     * @return {Bluebird<any>} - response promise
     */
    public requestPromise <T> (opts: RESTOptions): Bluebird<T> {
        return Bluebird.resolve(this.reqPromise(opts));
    }
}
