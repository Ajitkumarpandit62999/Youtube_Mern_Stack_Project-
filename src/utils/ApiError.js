class ApiError extends Error{

    constructor(
        statusCode,
        message="something went Wrong",
        errors = [],
        stack = ""
    ){
        super(message)
        this.statusCode= statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errror = this.errors

        if(stack) {
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor)
        }

    }


}

export {ApiError}