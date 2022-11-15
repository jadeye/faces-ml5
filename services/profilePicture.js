const { FaceModel } = require("../models/face");

const getAllFaces = async () => {
    const profiles = await FaceModel.find({});
    if (!profiles.length) {
        console.log('============== INSIDE ERROR ===============');
        throw new Error("No faces");
    }
    return profiles;
}



module.exports = { getAllFaces };