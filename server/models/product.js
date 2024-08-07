const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    product_id: {type: Number, required: true},
    name: {type: String, required: true},
    image: {type: String, required: true},
    category: {type: String, required: true},
    new_price: {type: Number, required: true},
    old_price: {type: Number, required: true},
    date: {type: Date, default: Date.now},
    availability: {type: Boolean, default: true}
});

const product = mongoose.model("products", productSchema);
module.exports = product;