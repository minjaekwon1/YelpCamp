// This is a custom Error Class that will be used in the app
// Used so we can specify what the status code and msg should be
class ExpressError extends Error {
    constructor(msg, status) {
        // 'super()' runs the c'tor from the Error parent class
        super();
        this.message = msg;
        this.statusCode = status;
    }
}

module.exports = ExpressError;