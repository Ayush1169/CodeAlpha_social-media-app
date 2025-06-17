const { default: mongoose } = require("mongoose");

const postSchema = new mongoose.Schema({
    
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },
    image: { type: String, required: true},
    caption: { type: String,},
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    createdAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Post", postSchema);