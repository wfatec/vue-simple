"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var storage_1 = require("./storage");
var crypto_1 = require("./crypto");
var CANCELTTYPE = {
    CACHE: 1,
    REPEAT: 2,
};
var transformCacheKey = null;
var pendingRequests = [];
var dataToString = function (data) {
    return data ? JSON.stringify(data) : "";
};
var defaultTransformCacheKey = function (url, data, method) {
    return url + dataToString(data) + (method || "");
};
var defaultShouldCache = function (data) { return !!data; };
var http = axios_1.default.create({
    headers: { "Content-Type": "application/json" },
});
var storage = new storage_1.default(window.sessionStorage);
var crypto = new crypto_1.default("cacheKey");
http.interceptors.request.use(function (config) {
    /**
     * 为每一次请求生成一个cancleToken
     */
    var source = axios_1.default.CancelToken.source();
    config.cancelToken = source.token;
    transformCacheKey = config.transformCacheKey || defaultTransformCacheKey;
    /**
     * 缓存命中判断
     * 成功则取消当次请求
     */
    var md5Key = crypto.encrypt(transformCacheKey(config.url, config.data, config.method));
    var data = storage.get(md5Key);
    if (data && Date.now() <= data.exppries) {
        console.log("\u63A5\u53E3\uFF1A" + config.url + " \u7F13\u5B58\u547D\u4E2D -- " + Date.now() + " -- " + data.exppries);
        source.cancel(JSON.stringify({
            type: CANCELTTYPE.CACHE,
            data: data.data,
        }));
    }
    /**
     * 重复请求判断
     * 同url，同请求类型判定为重复请求
     * 以最新的请求为准
     */
    /**
     * 将之前的重复且未完成的请求全部取消
     */
    var hits = pendingRequests.filter(function (item) { return item.md5Key === md5Key; });
    if (hits.length > 0) {
        hits.forEach(function (item) {
            return item.source.cancel(JSON.stringify({
                type: CANCELTTYPE.REPEAT,
                data: "重复请求，已取消",
            }));
        });
    }
    /**
     * 将当前请求添加进请求对列中
     */
    pendingRequests.push({
        md5Key: md5Key,
        source: source,
    });
    return config;
});
http.interceptors.response.use(function (res) {
    /**
     * 不论请求是否成功，
     * 将本次完成的请求从请求队列中移除
     */
    var dataParse = res.config.data && JSON.parse(res.config.data);
    // 以同样的加密方式(MD5)获取加密字符串
    var md5Key = crypto.encrypt(transformCacheKey(res.config.url, dataParse, res.config.method));
    var index = pendingRequests.findIndex(function (item) { return item.md5Key === md5Key; });
    if (index > -1) {
        pendingRequests.splice(index, 1);
    }
    if (res.status >= 200 && res.status < 300) {
        var shouldCache = res.config.shouldCache || defaultShouldCache;
        if (dataParse) {
            if (dataParse.cache && shouldCache(res.data)) {
                if (!dataParse.cacheTime) {
                    dataParse.cacheTime = 1000 * 60 * 3;
                }
                storage.set(md5Key, {
                    data: res.data,
                    exppries: Date.now() + dataParse.cacheTime,
                });
                console.log("\u63A5\u53E3\uFF1A" + res.config.url + " \u8BBE\u7F6E\u7F13\u5B58\uFF0C\u7F13\u5B58\u65F6\u95F4: " + dataParse.cacheTime);
            }
        }
        return res.data;
    }
    else {
        return Promise.reject("接口报错了！");
    }
});
/**
 * 封装 get、post 请求
 * 集成接口缓存过期机制
 * 缓存过期将重新请求获取最新数据，并更新缓存
 * 数据存储在localstorage
 * {
 *      cache: true
 *      cacheTime: 1000 * 60 * 3  -- 默认缓存3分钟
 * }
 */
var request = {
    get: function (url, config) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            http
                .get(url, config)
                .then(function (res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    resolve(res);
                    return [2 /*return*/];
                });
            }); })
                .catch(function (error) {
                if (axios_1.default.isCancel(error)) {
                    var cancle = JSON.parse(error.message);
                    if (cancle.type === CANCELTTYPE.REPEAT) {
                        return resolve([]);
                    }
                    else {
                        return resolve(cancle.data);
                    }
                }
                else {
                    return reject(error);
                }
            });
        });
    },
    post: function (url, data, config) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            http
                .post(url, data, config)
                .then(function (res) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    resolve(res);
                    return [2 /*return*/];
                });
            }); })
                .catch(function (error) {
                if (axios_1.default.isCancel(error)) {
                    var cancle = JSON.parse(error.message);
                    if (cancle.type === CANCELTTYPE.REPEAT) {
                        return resolve(null);
                    }
                    else {
                        return resolve(cancle.data);
                    }
                }
                else {
                    return reject(error);
                }
            });
        });
    },
};
exports.default = request;
//# sourceMappingURL=index.js.map