import { AxiosRequestConfig } from "axios";
export interface cacheTransformer {
    (url: string, data?: any, method?: string): any;
}
export interface shouldCache {
    (data: any): boolean;
}
interface RequestConfig extends AxiosRequestConfig {
    transformCacheKey?: cacheTransformer;
    shouldCache?: shouldCache;
}
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
declare const request: {
    get(url: string, config?: RequestConfig): Promise<unknown>;
    post(url: string, data?: any, config?: RequestConfig): Promise<unknown>;
};
export default request;
