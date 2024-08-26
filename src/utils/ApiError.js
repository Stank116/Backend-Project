class ApiError  {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = " "
    ){
        
        this.statusCode = statusCode
        this.errors = errors
        this.data = null
        this.message = message
        this.success = false
        this.stack = stack
    }
}

export {ApiError}