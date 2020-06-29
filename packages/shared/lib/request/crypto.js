"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as CryptoJS from "crypto-js";
// const MD5 = require("crypto-js/md5")
var MD5 = require("crypto-js/md5");
var Crypto = /** @class */ (function () {
    function Crypto(key) {
        /**
         * 如需秘钥，可以在实例化时传入
         */
        this.key = key;
    }
    /**
     * 加密
     * @param word
     */
    Crypto.prototype.encrypt = function (word) {
        if (!word) {
            return "";
        }
        // const encrypted = CryptoJS.MD5(word);
        var encrypted = MD5(word);
        return encrypted.toString();
    };
    return Crypto;
}());
exports.default = Crypto;
//# sourceMappingURL=crypto.js.map