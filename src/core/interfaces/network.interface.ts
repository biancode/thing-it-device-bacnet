import { Options } from 'request';

/* Options */
export { Options as RESTOptions } from 'request';
export { RequestCallback as RESTRequestCallback } from 'request';
export { Request as RESTRequest } from 'request';
export type SOAPOptions = Options & { methodName: string; };

export interface IXMLSOAPData {
    [tagName: string]: string | number | IXMLSOAPData;
}

export interface IJSONSOAPData <T> {
    fnName: string;
    payload: T;
}
