"use strict";

var AppStore = require("./core/app.store");

var BACnetReducer = require("./reducers");
exports.store = new AppStore(BACnetReducer.StoreReducer, BACnetReducer.StoreInitialState);
