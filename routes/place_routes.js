const express = require("express")
const { check } = require("express-validator");

const router = express.Router();

const placeController = require("../controller/places");
const fileUpLoad = require("../middleware/file-upload");
const authCheck = require("../middleware/check-auth");




router.get("/:pid", placeController.getPlacesByID);

router.get("/user/:uid", placeController.getPlacesByUserID);

router.use(authCheck);

router.post("/",
    fileUpLoad.single("image"),
    [
        check("title").not().isEmpty(),
        check("description").isLength({ min: 5 }),
        check("address").not().isEmpty(),
        check("creator").not().isEmpty(),
        // check("coordinates").not().isEmpty()
    ],
    placeController.createPlace);

router.patch("/:pid", placeController.updatePlace);

router.delete("/:pid", placeController.deletePlace);

module.exports = router;