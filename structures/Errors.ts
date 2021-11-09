class AlreadyExistsError extends Error {
    constructor(message: string) { super(message) };
}

class DoesNotExistError extends Error {
    constructor(message: string) { super(message) };
}

class HasActiveChildError extends Error {
    constructor(message: string) { super(message) };
}

export { AlreadyExistsError, DoesNotExistError, HasActiveChildError }