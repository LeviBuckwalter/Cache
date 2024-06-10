import { globals } from "./globals.js"
import { discard } from "./endUser.js"

export function putOutHit(cacheKey) {
    /*
    Starts a setTimeout function that will come back and discard the entry under the given cacheKey at the expiration timestamp. In case the entry under the given key has been discarded and replaced with something fresher by the expiration timestamp, the function makes sure that what it's about to delete is indeed expired.
    In my imagination this is like a hitman who you hire to go assasinate a target, or a mark. Once you've hired the hitman, even if the mark is still alive, you can rest easy knowing it is going to be taken care of. So it's about how you can take this off your mind once you've put out the hit.
    */
    const mark = globals.cache[cacheKey]
    if (mark.expirationTS === null) {
        //expirationTS === null means it's evergreen and won't expire. I don't know what happens when you try to do a setTimeout with a duration of null.
        console.log("mark.expirationTS === null")
        //my code is supposed to stop it before it gets here if its null, although nothing will break if it gets here.
        return
    } else {
        setTimeout(
            () => {
                if (Date.now() >= mark.expirationTS - 5) {
                    discard(cacheKey)
                } else {
                    console.log("it wasn't time yet")
                    console.log(mark.expirationTS, Date.now())
                    console.log(mark)
                }
            },
            /*duration:*/ mark.expirationTS - Date.now()
        )
    }

}

export function removeAllExpired() {
    /*
    Expired entries will be removed automatically, but when you first boot up your program there are bound to be a bunch of entries that have expired "overnight," so to speak, and those won't be removed automatically. So this function will go through the cache manually and remove items that are past expiration.
    ALSO: it will "put out hits" on everything it doesn't immediately remove (and that's not expirationTS = null)
    */
    let cacheKeys = Object.keys(globals.cache)
    for (let key of cacheKeys) {
        const entry = globals.cache[key]
        if (entry.expirationTS !== null) {
            if (Date.now() >= entry.expirationTS) {
                discard(key)
            } else {
                putOutHit(key)
            }
        }
    }
}

export function recordAccess(key) {
    const entry = globals.cache[key]
    if (entry.expirationTS === null) {
        return
    }

    const lookBackAmt = 5

    const ledger = globals.cache["ledger"].item
    if (ledger.length !== 0) {
        for (let i = ledger.length - 1; i > ledger.length - 1 - lookBackAmt; i--) {
            if (ledger[i] === key) {
                //redundant
                return
            }
        }
    }

    ledger.push(key)
    if (ledger.length > 1000) {
        ledger.shift()
    }
}

export function trimCache() {
    function cacheTooBig() {
        /*
        Returns true or false depending on whether the cache is too big. NOTE: it's not looking at cache.txt, it's looking at globals.cache.
        */
        const cacheSize = JSON.stringify(globals.cache).length / 1000000 //~1MB per million characters
        console.log(`The cache is ${cacheSize} MBs`)
        return cacheSize > 500
    }

    function removeOne() {
        /*
        Removes 1 entry from the cache that hasn't been accessed recently in order to save space.
        */
        const setOfBadKeys = new Set()
        for (let key in globals.cache) {
            const entry = globals.cache[key]
            if (entry.expirationTS !== null) {
                setOfBadKeys.add(key)
            }
        }
        const ledger = globals.cache["ledger"].item
        if (ledger.length !== 0) {
            for (let i = ledger.length - 1; i > 0; i--) {
                if (setOfBadKeys.size > 1) {
                    setOfBadKeys.delete(ledger[i])
                } else {
                    break
                }
            }
        }

        const arrayOfBadKeys = [...setOfBadKeys.values()]
        const randomIndex = Math.floor(Math.random() * arrayOfBadKeys.length)
        const keyForRemoval = arrayOfBadKeys[randomIndex]
        discard(keyForRemoval)
    }

    while (cacheTooBig()) {
        removeOne()
    }
}