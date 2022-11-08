const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecognziedPeople = new Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    imagePath: {
        type: String,
        required: true
    },
}, { timestamps: true });


exports.FaceModel = mongoose.model('RecognziedPeople', RecognziedPeople);
