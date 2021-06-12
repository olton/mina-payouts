export const print = (...args) => {
    console.log(...args)
}

export const error = (...args) => {
    console.error(...args)
}

export const exit = (message, code = 0) => {
    code ? error(message) : print(message)
    process.exit(code)
}
