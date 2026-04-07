const HttpError = require("../models/http-error");

const appRouteErrorHandler = (req,res,next)=>{
    const error = new HttpError("Could not find this route.", 404);
    throw error;
};

exports.appRouteErrorHandler = appRouteErrorHandler;