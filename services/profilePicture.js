const { FaceProfile } = require("../models/faceProfile");

const getAllFaces = async () => {
    const profiles = await FaceProfile.find({});
    if (!profiles.length) {
        console.log('============== INSIDE ERROR ===============');
        throw new Error("No faces");
    }
    return profiles;
}



module.exports = { getAllFaces };