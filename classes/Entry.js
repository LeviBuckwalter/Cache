import { customStringify } from "../functions/parseAndStringify.js"
import { params } from "../parameters.js"

export class Entry {
    constructor(contents, doesExpire, shelfLife) {
        this.contents = contents
        this.doesExpire = doesExpire
        if (this.doesExpire) {
            this.expireTS = Date.now() + shelfLife
        }
        this.bites = customStringify(this.contents).length + params.entryExtraBites
    }

    get expired() {
        if (this.doesExpire) {
            return Date.now() > this.expireTS
        } else {
            return false
        }
    }
}