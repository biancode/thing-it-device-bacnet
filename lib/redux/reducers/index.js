"use strict";
var redux = require("redux");

var BACnetReducer = require("./bacnet.reducer");
/* Store Initial State */
exports.StoreInitialState = {
    bacnet: BACnetReducer.InitialState,
};
/* Combine State Reducers */
exports.StoreReducer = redux.combineReducers({
    bacnet: BACnetReducer.Reducer,
});
