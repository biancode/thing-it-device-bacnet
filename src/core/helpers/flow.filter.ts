import * as _ from 'lodash';

import * as BACnet from 'bacnet-logic';

import * as Interfaces from '../interfaces';


type BACnetFlowFilter = (resp: Interfaces.FlowManager.Response) => boolean;

export class FlowFilter {

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
  public static isServiceType (serviceType: BACnet.Enums.ServiceType): BACnetFlowFilter {
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
  public static isServiceChoice (serviceChoice: any): BACnetFlowFilter {
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
    public static isBACnetObject (objId: BACnet.Types.BACnetObjectId): BACnetFlowFilter {
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
  public static isBACnetProperty (propId: BACnet.Enums.PropertyId): BACnetFlowFilter {
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
  public static isBACnetVendorId (vendorId: number): BACnetFlowFilter {
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
  public static isBACnetIPAddress (ipAddress: string): BACnetFlowFilter {
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
  public static matchFilter (isRequired: boolean, filterFn: BACnetFlowFilter,
    matchName: string = 'object'): BACnetFlowFilter {
    return (resp: Interfaces.FlowManager.Response): boolean => {
        if (!isRequired || filterFn(resp)) {
            return true;
        }
        return false;
    };
  }

}
