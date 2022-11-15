const { FaceModel } = require('../models/face');
const { FaceProfile } = require('../models/faceProfile');

// TODO: function create face profile object then save person details and url related
const savePersonFace = async ({ id, name, imagePath }) => {
    const profileImage = await FaceProfile.findOne({ id });
    if (!profileImage) {
        const profile = await FaceProfile.create({ id, imagePath });
        return await FaceModel.create({ id, name, faceProfile: profile._id });
    } else if (profileImage) {
        throw new Error("Person is already exists.");
    }
}

module.exports = { savePersonFace };
