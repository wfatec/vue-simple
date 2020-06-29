"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Storage = /** @class */ (function () {
    function Storage(storage) {
        this.storage = storage || sessionStorage;
    }
    Storage.prototype.get = function (key) {
        if (!key) {
            return;
        }
        var text = this.storage.getItem(key);
        try {
            if (text) {
                return JSON.parse(text);
            }
            else {
                this.storage.removeItem(key);
                return null;
            }
        }
        catch (_a) {
            this.storage.removeItem(key);
            return null;
        }
    };
    Storage.prototype.set = function (key, data) {
        if (!key) {
            return;
        }
        this.storage.setItem(key, JSON.stringify(data));
    };
    Storage.prototype.remove = function (key) {
        if (!key) {
            return;
        }
        this.storage.removeItem(key);
    };
    return Storage;
}());
exports.default = Storage;
//# sourceMappingURL=storage.js.map