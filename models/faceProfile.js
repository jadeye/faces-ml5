const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const FaceProfile = new Schema({
    id: {
        type: String,
        required: true
    },
    imagePath: {
        type: String,
        required: true
    }
}, { timestamps: true });


exports.FaceProfile = mongoose.model('faceProfile', FaceProfile);
