// const { v4: uuid } = require("uuid");
const { validationResult, matchedData } = require("express-validator");
const bcrypt = require("bcrypt");

const User = require("../models/user");
const HttpError = require("../models/http-error");
const fileUpLoad = require("../middleware/file-upload");
const jwt = require("jsonwebtoken");


const getUserByID = async (req, res, next) => {
    console.log("GET /user/:uid is working")

    const userId = req.params.uid;
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new HttpError("Could not find a user for the provided id.", 404);
        }
        else {
            const safeUser = user.toObject({ getters: true });
            res.json({
                status: "success",
                user: {
                    name: safeUser.name,
                    email: safeUser.email
                }
            });
        }
    } catch (err) {
        console.error("Error fetching user:", err);
        return next(new HttpError("Something went wrong, could not fetch user.", 500));
    }

};

const getAllUsers = async (req, res, next) => {
    console.log("GET /users is working");
    try {
        const allUsers = await User.find({}, { password: 0 }); // Exclude password field
        res.json({ status: "success", users: allUsers });
    } catch (err) {
        console.error("Error fetching users:", err);
        return next(new HttpError("Something went wrong, could not fetch users.", 500));
    }
};


const createUser = async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return next(new HttpError("11Invalid input, please check your data.", 422));
    }


    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return next(new HttpError("User with this email already exists.", 422));
        }        
    } catch (err) {
        console.error("Error during user creation:", err);
        return next(new HttpError("Creating user failed, please try again.", 500));
    }
    const hashedPassword = await bcrypt.hash(password, 12); // Using async hash is better practice
    const newUser = new User({
        name: name.trim(),
        email: email.trim(),
        password: hashedPassword,
        image: req.file.path,
        // places: []
    });
    try {
        await newUser.save();
    } catch (err) {
        console.error("Error saving user to database:", err);
        return next(new HttpError("Creating user failed, please try again.", 500));
    }

    let token;
    try {        token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET, // In production, use process.env.JWT_SECRET
            { expiresIn: "3d" }
        );
    } catch (err) {
        console.error("Error generating JWT:", err);
        return next(new HttpError("Something went wrong, could not make token.", 500));
    }

    res.status(201).json({
        message: "User created successfully",
        token: token,
        user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            image: newUser.image
        }
    });
};

const loginUser = async (req, res, next) => {

    console.log("POST /user/log-in is working");


    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors.array());
        return next(new HttpError("Invalid input, please check your data.", 422));
    }
    const { email, password } = req.body


    let user;
    try {
        user = await User.findOne({ email });

    } catch (err) {
        console.error("Error during login:", err);
        return next(new HttpError("Something went wrong, could not log you in9.", 500));
    }

    console.log("User found:", user);
    if (!user) {
        return next(new HttpError("cant find the user", 401));
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        return next(new HttpError("Invalid credentials, could not log you in.", 401));
    }
    let token;
    try{
        token = jwt.sign(
           { userId: user.id, email: user.email },
           process.env.JWT_SECRET,
           { expiresIn: "3d" }
       );
    }catch(err){
        console.error("Error generating JWT:", err);
        return next(new HttpError("Something went wrong, could not log you in.", 500));
    }


    res.json({
        message: "Logged in successfully",
        token: token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
};

module.exports = {
    getUserByID,
    createUser,
    loginUser,
    getAllUsers
};