const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
    receiver: { type: mongoose.Schema.Types.ObjectId,  ref: "User"},
    message: String,
    timeStamp: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Chat", chatSchema)