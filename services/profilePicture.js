const { FaceProfile } = require("../models/faceProfile");

const getAllFaces = async () => {
    const profiles = await FaceProfile.find({});
    if (!profiles.length) {
        throw new Error("No faces");
    }
    return profles;
}



module.exports = { getAllFaces };