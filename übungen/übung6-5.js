// Varaible declarations sind auch anweisungen, also aufs globale objekt packen :)
globalThis.deepCopy = (obj) =>
    typeof obj == "object" ?
        (
            Array.isArray(obj) ?
                obj.map(deepCopy) // Array
                : Object.fromEntries(Object.entries(obj).map(deepCopy)) // Object
        )
        : obj; // strings, booleans, numbers, undefined, bigint sind eh immutable und müssen nicht kopiert werden
// der rest: function, symbol können nicht kopiert werden


globalThis.orig = [{ "a": true }, 4];
globalThis.copy = deepCopy(orig)
console.assert(orig !== copy, "Keine deepcopy auf level 0 beim array")
console.assert(orig[0] !== copy[0], "Keine deepcopy auf level 1 beim object")
console.assert(JSON.stringify(orig) === JSON.stringify(copy), "Objekte sind verschieden")
