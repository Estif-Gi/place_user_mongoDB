const { v4: uuid } = require("uuid");
const { validationResult, matchedData } = require("express-validator");
const mongoose = require("mongoose");

const Place = require("../models/place");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const { request } = require("express");



const getPlacesByID = async (req, res, next) => {

    console.log("GET /places is working")

    try {
        const place = await Place.findById(req.params.pid);
        if (!place) {
            throw new HttpError("Could not find a place for the provided id.", 404);
        }
        else {
            res.json({ place: place.toObject({ getters: true }) });
        }
    } catch (err) {
        console.log("Error fetching place from database:", err);
        throw new HttpError("Something went wrong, could not find a place.", 500);
    }


};

const getPlacesByUserID = async (req, res, next) => {

    console.log("GET /user is working")
    try {
        const places = await Place.find({ creator: req.params.uid });

        if (!places || places.length === 0) {
            throw new HttpError("Could not find a place for the provided user id.", 404);
        }
        else {
            res.status(200).json({ places: places.map(place => place.toObject({ getters: true })) });
        }
    } catch (err) {
        console.log("Error fetching places from database:", err);
        throw new HttpError("Something went wrong, could not find places.", 500);
    }
};

const createPlace = async (req, res, next) => {
    console.log("POST /places is working");

    const { title, description, coordinates, address, creator } = req.body;

    let user;
    let userId;

    // 1. Find the user\
    try {
        userId = req.userData.userId;
        user = await User.findById(userId);
        if (!user) {
            console.log("Could not find user for provided id:", creator);
            return next(new HttpError("Could not find user for provided id.", 404));
        }
    } catch (err) {
        console.log("Error fetching user from database:", err);
        return next(new HttpError("Something went wrong, could not find user.", 500));
    }

    console.log("#2 - File received:", req.file?.path);
    if (!userId) {
        console.log("qw Authenticated user ID does not match creator ID:", userId);
        return next(new HttpError("You are not allowed to create a place for another user.", 403));
    }
    // 2. Create the place document
    const createdPlace = new Place({
        title,
        description,
        location: {
            lat:31.9979, lng:35.6528
        },   // Make sure your Place schema expects 'location'
        address,
        creator: userId,  // Use authenticated user's ID
        image: req.file?.path,   // Add safety check
    });

    console.log("#3 - Place object created");

    try {
        const sess = await mongoose.startSession();
        sess.startTransaction();

        await createdPlace.save({ session: sess });

        user.places.push(createdPlace);
        await user.save({ session: sess });

        await sess.commitTransaction();
        await sess.endSession();

        console.log("Place created successfully with transaction");

    } catch (err) {
        console.log("Error creating place with transaction:", err);

        if (req.file?.path) {
            console.log("Would delete uploaded file:", req.file.path);
        }

        return next(new HttpError("S00omething went wrong, could not create place.", 500));
    }

    // 4. Send success response
    res.status(201).json({
        message: "Place created successfully",
        place: createdPlace.toObject({ getters: true })
    });
};

const updatePlace = async (req, res, next) => {
    console.log("PATCH /places is working")


    const placeId = req.params.pid;
    const { title, description, address, coordinates, location } = req.body;

    let updatedPlace;

    try {
        updatedPlace = await Place.findById(placeId);
    } catch (err) {
        console.log("Error fetching place from database:", err);
        return next(new HttpError("Something went wrong, couldn't find place.", 500));
    }

    if (!updatedPlace) {
        return next(new HttpError("Could not find a place for the provided id.", 404));
    }
    console.log("Place found for update:", updatedPlace.creator);
    console.log("Authenticated user ID:", req.userData.userId);

    if (updatedPlace.creator.toString() !== req.userData.userId) {
        return next(new HttpError("You are not allowed to edit this place.", 403));
    }

    if (title !== undefined) {
        updatedPlace.title = title;
    }
    if (description !== undefined) {
        updatedPlace.description = description;
    }
    if (address !== undefined) {
        updatedPlace.address = address;
    }
    if (location !== undefined) {
        updatedPlace.location = location;
    }

    try {
        await updatedPlace.save();
        res.status(200).json({ place: updatedPlace.toObject({ getters: true }) });
    } catch (err) {
        console.log("Error updating place in database:", err);
        return next(new HttpError("Something went wrong, couldn't update place.", 500));
    }
};

const deletePlace = async (req, res, next) => {
    console.log("DELETE /places is working");

    const placeId = req.params.pid;
    let deletedPlace;
    try {
        deletedPlace = await Place.findById(placeId).populate("creator");
        if (!deletedPlace) {
            return next(new HttpError("Could not find a place for the provided id.", 404));
        }
    } catch (err) {
        console.log("Error fetching place from database:", err);
        return next(new HttpError("Something went wrong, couldn't find place.", 500));
    }
    if (deletedPlace.creator.id !== req.userData.userId.toString()) {
        return next(new HttpError("You are not allowed to delete this place.", 403));
    }

    try{
        const sess = await mongoose.startSession();
        sess.startTransaction();
        await deletedPlace.deleteOne({ session: sess });
        deletedPlace.creator.places.pull(deletedPlace);
        await deletedPlace.creator.save({ session: sess });
        await sess.commitTransaction();
        await sess.endSession();

        res.status(200).json({ message: "Place deleted successfully" });
    }catch(err){
        console.log("Error deleting place:", err);
        return next(new HttpError("Something went wrong, couldn't delete place.", 500));
    }
};

exports.getPlacesByID = getPlacesByID;
exports.getPlacesByUserID = getPlacesByUserID;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
