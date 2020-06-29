declare class Crypto {
    key: string;
    constructor(key: string);
    /**
     * 加密
     * @param word
     */
    encrypt(word: string | undefined): string;
}
export default Crypto;
