declare class Storage {
    storage: globalThis.Storage;
    constructor(storage?: globalThis.Storage);
    get(key: string | undefined): any;
    set(key: string | undefined, data: any): void;
    remove(key: string | undefined): void;
}
export default Storage;
