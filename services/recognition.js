const { FaceProfile } = require("../models/faceProfile");
const { RecognizedPeople } = require("../models/recognizedPeople");

FaceProfile;
const saveRecognizedPerson = async (authPerson) => {
    // authorizedPeople = authorizedPeople.filter((person) => person.id !== authPerson.id); // remove the auth person from the array
    const profilePicture = await FaceProfile.findOne({ id: authPerson.id });
    if (!profilePicture) throw new Error('Person`s profile picture isnt exists');
    return await RecognizedPeople.create({ id: authPerson.id, name: authPerson.name, imagePath: profilePicture.imagePath });
}


module.exports = { saveRecognizedPerson };