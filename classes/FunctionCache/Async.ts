import { Cache } from "../Cache.ts"

type constructor<T> = new (...args: any) => T

export class AsyncFunctionCache<F extends (...args: any) => Promise<any>> {
    private func: F
    private cache: Cache<ReturnType<F>>
    private shelfLife: number | undefined

    constructor(
        name: string,
        func: F,
        cacheSize: number, //measured in MBs
        expectedClasses: constructor<any>[],
        shelfLife: number | undefined
    ) {
        this.func = func
        this.cache = new Cache(name, cacheSize, expectedClasses)
        this.shelfLife = shelfLife
    }

    public async call(...params: Parameters<F>): Promise<ReturnType<F>> {
        const key: string = JSON.stringify(params)

        const cacheResult = this.cache.retrieve(key)
        if (cacheResult) {
            return cacheResult
        }
        //else:
        const funcResult = await this.func(...params)
        this.cache.store(key, funcResult, this.shelfLife)
        return funcResult
    }
}