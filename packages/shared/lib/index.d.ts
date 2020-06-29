export declare const isObject: (val: unknown) => val is Record<any, any>;
export declare const def: (obj: object, key: string | symbol, value: any) => void;
export declare const hasOwn: (val: object, key: string | symbol) => key is never;
