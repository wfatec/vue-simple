"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isObject = function (val) {
    return val !== null && typeof val === "object";
};
exports.def = function (obj, key, value) {
    Object.defineProperty(obj, key, {
        configurable: true,
        value: value,
    });
};
var hasOwnProperty = Object.prototype.hasOwnProperty;
exports.hasOwn = function (val, key) { return hasOwnProperty.call(val, key); };
//# sourceMappingURL=index.js.map