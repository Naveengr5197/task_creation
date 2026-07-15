const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    // with auth
    _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    },
    createdBy: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String,
        trim: true
    },
    updatedAt: {
        type: Date
    },
    isShared: {
        type: Boolean,
        default: false
    }
})

const List = mongoose.model('List', ListSchema);

module.exports = { List }