const asyncHandler = (requesthandler) => {
    (req, res, next) => {
        Promise.resolve(requesthandler(req, res, next)).catch(error => next(error) )
        
    }
}

export {asyncHandler}

// const asyncHandler = (fun) =>  async (req,res,next) => {
//     try{
//         await fun(req, res, next)
//     }
//     catch(error){
//         res.status(error.code).json({
//             success : false,
//             message : error.message
//         })
//     }
// }