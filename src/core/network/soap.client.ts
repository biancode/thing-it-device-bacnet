import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as xml2js from 'xml2js'

import { RESTClient } from './rest.client';

import {
    IXMLSOAPData,
    SOAPOptions,
    IJSONSOAPData,
} from '../interfaces';

export class SOAPClient {
    private restClient: RESTClient;

    constructor () {
        this.restClient = new RESTClient();
    }

    /**
     * request - sends the SOAP request.
     *
     * @param  {SOAPOptions} opts - SOAP request options
     * @return {Bluebird<string>} - response promise
     */
    public request <T> (opts: SOAPOptions): Bluebird<IJSONSOAPData<T>|IJSONSOAPData<T>[]> {
        const xmlSOAPData = this.getXMLSOAPData(opts.body);
        const xmlSOAPMessage = this.getXMLSOAPMessage(opts.methodName, xmlSOAPData);

        const newOpts = _.assign({}, _.cloneDeep(opts), {
            body: xmlSOAPMessage,
            json: false,
        });

        return this.restClient.requestPromise<string>(newOpts)
            .then((result) => this.parseSOAPMessageToJSON<T>(result));
    }

    /**
     * parseSOAPMessageToJSON - parses the XML SOAP message.
     *
     * @param  {string} xmlSOAPResp - SOAP response in XML format
     * @return {Bluebird<IJSONSOAPData<T>|IJSONSOAPData<T>[]>} - JSON SOAP object
     */
    private parseSOAPMessageToJSON <T> (xmlSOAPResp: string): Bluebird<IJSONSOAPData<T>|IJSONSOAPData<T>[]> {
        return new Bluebird((resolve, reject) => {
            xml2js.parseString(xmlSOAPResp, {
                explicitArray: false,
                ignoreAttrs: true,
                valueProcessors: [ xml2js.processors.parseBooleans ],
            }, (err, result) => {
                // Get object with functions
                const fnObj = result['soap:Envelope']['soap:Body'];

                // Get function names
                const fnNames: string[] = [];
                for (const propName in fnObj) {
                    if (!fnObj.hasOwnProperty(propName)) {
                        continue;
                    }
                    fnNames.push(propName);
                }

                // Create JSON SOAP object
                const jsonResult: IJSONSOAPData<T>[] = _.map(fnNames, (fnName) => ({
                    fnName: fnName,
                    payload: fnObj[fnName],
                }));

                if (jsonResult.length === 1) {
                    return resolve(jsonResult[0]);
                }

                resolve(jsonResult);
            });
        });
    }

    /**
     * getXMLSOAPMessage - creates the request message in SOAP format.
     *
     * @param  {string} methodName - SOAP method name
     * @param  {string} xmlSOAPData - SOAP xml data
     * @return {string} - XML request message in SOAP format
     */
    private getXMLSOAPMessage (methodName: string, xmlSOAPData: string) {
        return `
            <soapenv:Envelope
                    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                    xmlns:daa="http://daa.ispf.philips.com">
                <soapenv:Header/>
                <soapenv:Body>
                    <daa:${methodName}>
                        ${xmlSOAPData}
                    </daa:${methodName}>
                </soapenv:Body>
            </soapenv:Envelope>`;
    }

    /**
     * getXMLSOAPData - converts JSON/JS object to XML string in SOAP format.
     *
     * @example
     * { name: 'Thing-It', count: 213 } =>
     *     <name>Thing-It</name>
     *     <count>213</count>
     *
     * @param  {IXMLSOAPData} xmlSOAPData - JSON/JS object
     * @return {string} - XML string in SOAP format
     */
    private getXMLSOAPData (xmlSOAPData: IXMLSOAPData): string {
        let xmlStrs: string = '';

        for (let tagName in xmlSOAPData) {
            if (!xmlSOAPData.hasOwnProperty(tagName)) {
                continue;
            }

            const xmlStrData: string = typeof xmlSOAPData[tagName] === 'object'
                ? this.getXMLSOAPData(xmlSOAPData[tagName] as IXMLSOAPData)
                : `${xmlSOAPData[tagName]}`;

            xmlStrs += `<${tagName}>${xmlStrData}</${tagName}>`;
        }

        return xmlStrs;
    }
}
