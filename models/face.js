const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const FaceSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    parts: {
        type: Object,
        required: true
    },
    descriptors: {
        type: Object,
        required: true
    },
}, { timestamps: true });


exports.FaceModel = mongoose.model('peopleFaces', FaceSchema);
