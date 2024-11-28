function curry(func, arg1) {
    return (arg2) => func(arg1, arg2);
}

function add(a, b) { return a + b };
const inc = curry(add, 1)

function methodize(func) {
    return function (arg) {
        return func(this, arg);
    }
}

function demethodize(func) {
    return (a, b) => func.call(a, b)
}

function twice(func) {
    return (arg) => func(arg, arg);
}

function composeu(first, second) {
    return (param) => second(first(param))
}

function composeb(first, second) {
    return (a, b, c) => second(first(a, b), c);
}

function once(func) {
    let ran = false;
    return (...args) => {
        if (ran) throw new Error("Once-func was executed multiple times!")
        ran = true;
        return func(...args);
    }
}

function counterf(count) {
    return {
        inc() { return ++count; },
        dec() { return --count; }
    }
}

function revocable(func) {
    return {
        invoke(...args) { return func(...args) },
        revoke() {
            this.invoke = () => {
                throw new Error("Tried to invoke revoked function")
            }
        }
    }
}

function vector() {
    let arr = [];
    return {
        append(value) {
            arr.push(value);
        },
        store(index, value) {
            arr[index] = value;
        },
        get(index) {
            return arr[index];
        }
    };
}
