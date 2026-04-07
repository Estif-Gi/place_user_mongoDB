const errorHandler = require("../models/http-error");
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
    try{

        const token = req.headers.authorization.split(" ")[1]; // Expecting
        if (!token) {
            return next(new errorHandler("Authentication failed!please log in.", 401));
        }
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new errorHandler("Authentication failed! Invalid token.", 401));
            }
            req.userData = { userId: decoded.userId, email: decoded.email };
            next(); 
        })
    }catch(err){
        return next(new errorHandler("Authentication failed! Invalid token.", 401));
    }

    


}