// Rets a func after calling the passed in async func
// Mimics a try/catch block used to catch errs 
// '.catch(next)' catches errs, if any, from exe 'func' and passes them to 'next()' for the Error Handler to process
module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}
//// "For errs ret from async funcs invoked by route handlers and MW, you must pass them to 'next()', where Express will catch/process them"