
export enum BACnetTagTypes {
    application = 0,
    context = 1,
}

export enum BACnetPropTypes {
    nullData = 0,
    boolean = 1,
    unsignedInt = 2,
    real = 4,
    characterString = 7,
    bitString = 8,
    enumerated = 9,
    objectIdentifier = 12,
}

export enum BACnetBinaryPV {
    Inactive = 0,
    Active = 1,
}

export enum BACnetPolarity {
    Normal = 0,
    Reverse = 1,
}

export enum BACnetEventState {
    Normal = 0,
    Fault = 1,
    Offnormal = 2,
    HighLimit = 3,
    LowLimit = 4,
    LifeSafetyAlarm = 5,
}

export enum BACnetReliability {
    NoFaultDetected = 0,
    NoSensor = 1,
    OverRange = 2,
    UnderRange = 3,
    OpenLoop = 4,
    ShortedLoop = 5,
    NoOutput = 6,
    UnreliableOther = 7,
    ProcessError = 8,
    MultiStateFault = 9,
    ConfigurationError = 10,
    CommunicationFailure = 12,
    MemberFault = 13,
    MonitoredObjectFault = 14,
    Tripped = 15,
    LampFailure = 16,
    ActivationFailure = 17,
    RenewDhcpFailure = 18,
    RenewFdRegistrationFailure = 19,
    RestartAutoNegotiationFailure = 20,
    RestartFailure = 21,
    ProprietaryCommandFailure = 22,
    FaultsListed = 23,
    referencedObjectFault = 24,
}

export enum BACnetEngineeringUnits {
    metersPerSecondPerSecond = 166,
    // Area
    squareMeters = 0,
    squareCentimeters = 116,
    squareFeet = 1,
    squareInches = 115,
    // Currency
    currency1 = 105,
    currency2 = 106,
    currency3 = 107,
    currency4 = 108,
    currency5 = 109,
    currency6 = 110,
    currency7 = 111,
    currency8 = 112,
    currency9 = 113,
    currency10 = 114,
    // Electrical
    milliamperes = 2,
    amperes = 3,
    amperesPerMeter = 167,
    amperesPerSquareMeter = 168,
    ampereSquareMeters = 169,
    decibels = 199,
    decibelsMillivolt = 200,
    decibelsVolt = 201,
    farads = 170,
    henrys = 171,
    ohms = 4,
    ohmMeterSquaredPerMeter = 237,
    ohmMeters = 172,
    kilohms = 122,
    megohms = 123,
    microsiemens = 190,
    millisiemens = 202,
    siemens = 173,
    siemensPerMeter = 174,
    teslas = 175,
    volts = 5,
    millivolts = 124,
    kilovolts = 6,
    megavolts = 7,
    voltAmperes = 8,
    kilovoltAmperes = 9,
    megavoltAmperes = 10,
    voltAmperesReactive = 11,
    kilovoltAmperesReactive = 12,
    megavoltAmperesReactive = 13,
    voltsPerDegreeLelvin = 176,
    voltsPerMeter = 177,
    degreesPhase = 14,
    powerFactor = 15,
    webers = 178,
    // Other
    noUnits = 95,
}
