import { Cache } from "../Cache.ts"

type constructor<T> = new (...args: any) => T

export class SyncFunctionCache<F extends (...args: any) => any> {
    private func: F
    public cache: Cache<ReturnType<F>>
    private shelfLife: number | undefined

    constructor(
        name: string,
        func: F,
        cacheSize: number,
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

        const funcResult = this.func(...params)
        this.cache.store(key, funcResult, this.shelfLife)
        await this.cache.save()
        return funcResult
    }
}