export const params = {
    cacheMaxBites: 500 * 1000000,    //cache is not to exceed 500 MBs
    ledgSetsMaxProp: 0.2,           //the maximum size of a set in ledger relative to the size of cache.entries
    entryExtraBites: 120            //how many extra bites to add to the size of each entry to account for metadata
}