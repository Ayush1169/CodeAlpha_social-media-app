const mongoose = require ("mongoose")
const passportLocalMongoose = require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/hello")

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    require: true
  },
  profileImage: {
    type: String,
    default: ""
  },
  bio: {
    type: String
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: {
    type: Date,
    default: Date.now
  }
})
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema)