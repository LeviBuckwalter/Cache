import { customStringify } from "../functions/parseAndStringify.ts"
import { params } from "../parameters.ts"

export class Entry<T> {
    contents: T
    expireTS: number | null
    bytes: number
    
    constructor(contents: T, expireTS?: number | null) {
        this.contents = contents
        this.expireTS = (expireTS === undefined) ? null : expireTS
        this.bytes = customStringify(this.contents).length + params.entryExtraBites
    }

    get expired(): boolean {
        if (this.expireTS !== null) {
            return Date.now() > this.expireTS
        } else {
            return false
        }
    }

    toSeed(): [T, number | null] {
        return [this.contents, this.expireTS]
    }
}