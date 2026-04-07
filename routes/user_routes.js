const express = require('express');
const router = express.Router();

const userController = require("../controller/users");
const { check } = require('express-validator');
const fileUpLoad = require("../middleware/file-upload");



router.get("/all", userController.getAllUsers);

router.get("/:uid", userController.getUserByID);

router.post("/sign-up",
    fileUpLoad.single("image"),
    [
        check("name").trim().notEmpty().isLength({ min: 3 }),
        check("email").trim().isEmail().normalizeEmail(),
        check("password").isLength({ min: 6 })
    ],
    userController.createUser
);

router.post("/log-in", [
    check("email").trim().isEmail().normalizeEmail(),
    check("password").isLength({ min: 6 })
], userController.loginUser);



module.exports = router;