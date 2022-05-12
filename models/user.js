const mongoose = require('mongoose');
const passport = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    }
});
// Adds a 'username', 'salt', and 'hash' field to the 'Schema' to store the username, salt val, and hashed password & also adds some methods
UserSchema.plugin(passport);

module.exports = mongoose.model('User', UserSchema);