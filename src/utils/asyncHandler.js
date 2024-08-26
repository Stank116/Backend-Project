// const asyncHandler = (requesthandler) => {
//     return (req, res, next) => {
//              Promise.resolve(requesthandler(req, res, next)).catch(error => next(error) )
        
//     }
// 

const asyncHandler = (fun) =>  async (req,res,next) => {
    try{
       return await fun(req, res, next)
    }
    catch(error){
        res.status(error.code).json({
            success : false,
            message : error.message
        })
    }
}

export {asyncHandler}



