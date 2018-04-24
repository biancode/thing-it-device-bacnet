
export enum BLVCFunction {
    originalUnicastNPDU = 0x0a,
    originalBroadcastNPDU = 0x0b,
}

export enum BACnetConfirmedService {
    SubscribeCOV = 0x05,
    ReadProperty = 0x0c,
    ReadPropertyMultiple = 0x0e,
    WriteProperty = 0x0f,
    WritePropertyMultiple = 0x10,
}

export enum BACnetUnconfirmedService {
    iAm = 0x00,
    iHave = 0x01,
    covNotification = 0x02,
    eventNotification = 0x03,
    whoHas = 0x07,
    whoIs = 0x08,
}

export enum BACnetServiceTypes {
    ConfirmedReqPDU = 0x00,
    UnconfirmedReqPDU = 0x01,
    SimpleACKPDU = 0x02,
    ComplexACKPDU = 0x03,
    SegmentACKPDU = 0x04,
    ErrorPDU = 0x05,
    RejectPDU = 0x06,
    AbortPDU = 0x07,
}
