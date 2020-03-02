const mongoose = require('mongoose');
const {Schema} = mongoose;
const userSchema = new Schema({
    first: {
        type: String,
    },
    last: {
        type: String,
    },
    email:{
        type: String
    },
    age: {
        type: Number,
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});
const collectionName = 'userbencollect';
const User = mongoose.model('BoBBuddy', userSchema, collectionName);
module.exports = User;