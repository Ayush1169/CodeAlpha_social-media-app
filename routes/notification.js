const { default: mongoose } = require("mongoose");

const notificationSchema = new mongoose.Schema({
    type: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    createdAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
})
module.exports = mongoose.model("Notification", notificationSchema);