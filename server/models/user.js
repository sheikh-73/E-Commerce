const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {type: String},
    email: {type: String, unique: true},
    password: {type: String},
    cartData: {type: Object},
    Date: {type: Date, default: Date.now}
});

const User = mongoose.model("users", userSchema);
module.exports = User;