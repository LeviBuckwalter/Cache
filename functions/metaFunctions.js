import { cache } from "../cache.js"
import { params } from "../parameters.js"

export function trimCache() {
    const maximumBites = params.cacheMaxBites
    let killList = [...cache.metadata.ledger[0].values()]
    while (cache.metadata.totalBites - maximumBites > 0) {
        const randomIndex = Math.floor(Math.random() * killList.length)
        const randomKey = killList[randomIndex]
        discard(randomKey)
        killList.splice(randomIndex, 1)
        if (killList.length === 0) {
            killList = [...cache.metadata.ledger[0].values()]
            if (killList.length === 0) {
                console.log(`error: killList length = 0 after resetting to oldest set in ledger`)
            }
        }
    }
}

export function addToLedger(key) {
    //ask gideon: am I accidentally redifining the last element of ledger? something something pointers
    if (cache.metadata.ledger[cache.metadata.ledger.length - 1].size > cache.metadata.amtEntries * params.ledgSetsMaxProp) {
        cache.metadata.ledger.push(new Set())
    }
    cache.metadata.ledger[cache.metadata.ledger.length - 1].add(key)
}

export function removeFromLedger(key) {
    //Iterate through ledger and delete key. If this brings the size of the set down to 0, splice the set

    for (let i = 0; i < cache.metadata.ledger.length; i++) {
        const set = cache.metadata.ledger[i]
        if (set.delete(key)) {
            if (set.size === 0) {
                cache.metadata.ledger.splice(i, 1)
            }
            return
        }
    }

    //if not found in ledger:
    console.log(`The key "${key}" was asked to be removed from the ledger, but was not found in any of the sets.`)
    return
}