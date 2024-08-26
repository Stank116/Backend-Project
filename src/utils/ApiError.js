class ApiError extends error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = " "
    ){
        super(message)
        this.statusCode = statusCode
        this.errors = errors
        this.data = null
        this.message = message
        this.success = false
        this.stack = stack
    }
}

export {ApiError}