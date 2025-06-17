var express = require('express');
var router = express.Router();
const User = require('./users')
const Post = require('./post')
const upload = require("./multer")
const Comment = require('./comment')
const Chat = require('./chat')
const Notification = require('./notification')
const passport = require('passport');
const { path } = require('../app');

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}
/* GET home page. */
router.get('/', async(req, res) => {
  try{
    const posts = await Post.find()
    .populate('user')
    .populate({
      path: 'comments',
      populate: {path: 'user'}
    })
    .sort({ createdAt: -1})

    const notifications = req.user
    ? await Notification.find({ receiver: req.user._id })
    .populate('sender')
    .populate('post')
    .sort({ createdAt: -1})
    :[]

    res.render('index', { 
      currentUser: req.user,
       posts: posts,
       notifications
      })
  } catch (err){
    console.error(err)
    res.render('index', {
      currentUser: req.user,
      posts: [],
      notification: [],
    })
  }
})


router.get('/login', (req, res, next) => {
  res.render("login", {error: req.flash("error")})
})

router.get('/register', (req, res, next) => {
  res.render("register", {error: req.flash("error")})
})

router.post('/register', async (req, res, next) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("Email already registered.");
  }

  const userData = new User({ username, email });

  User.register(userData, password, function(err, user) {
    if (err) {
      console.error("Registration error:", err);
      return res.status(400).send("registration failed: " + err.message);
    }
    req.login(user, function(err) {
      if (err) {
        console.error("login error after registration:", err);
        return next(err);
      }
      return res.redirect('/login');
    });
  });
});
router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));
router.get('/logout', (req, res) => {
  res.redirect('/login')
})

router.get('/profile', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login')

    try{
      const user = await User.findById(req.user._id)
      .populate('followers')
      .populate('following')

      const userPosts = await Post.find({ user: user._id}).sort({ createdAt: -1 })

      res.render('profile', {
        user,
        currentUser: req.user,
        isFollowing: false,
        posts: userPosts
      })
    } catch (err) {
      console.error('Own profile error:', err)
      res.status(500).send("Error loading profile")
    }
})

router.get('/profile/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login")

  try {
    const user = await User.findById(req.params.id)
      .populate('followers')
      .populate('following');
    
    const currentUser = req.user;
    const isFollowing = currentUser.following.includes(user._id)

    const userPosts = await Post.find({ user: user._id}).sort({ createdAt: -1})

    res.render('profile', {
      user,
      currentUser : req.user,
      isFollowing, 
      posts: userPosts
    });

  } catch (err) {
    console.error("Profile route error:", err);
    res.status(404).send("User not found");
  }
});


router.post('/post', upload.single("image"), async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login')

    console.log("From Data", req.body)

    try {
  await Post.create({
    user: req.user._id,
    image: req.file.filename,
    caption: req.body.caption
  })
  res.redirect('/')
  } catch (err){
    res.send("post failed")
  }
})

router.get('/post/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    .populate("user")
    .populate({
      path: "comments",
      populate: {
        path: "user"
      }
    })
    if (!post) return res.status(404).send("post not found")

      res.render("post", { post, currentUser: req.user })
  } catch (err) {
    console.error(err)
    res.status(500).send("something went wrong")
  }
})

router.post("/post/delete/:id", async (req, res) => {
  const post = await Post.findById(req.params.id)
  if (post.user.equals(req.user._id)) {
    await Post.findByIdAndDelete(req.params.id)
  }
  res.redirect('/')
})

router.post('/like/:id', async (req, res) => {
   if (!req.isAuthenticated()) return res.redirect('/login');

  const post = await Post.findById(req.params.id)
  const userId = req.user._id

  if (!post.likes.includes(userId)) {
    post.likes.push(userId)
    await Notification.create({
      type: 'like',
      sender: req.user._id,
      receiver: post.user,
      post: post._id,
    })
  } else {
    post.likes = post.likes.filter(id => id.toString() !== userId.toString())
  }

  await post.save()
  res.redirect('/')
})

router.post('/comment/:id', async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/login')

  const { content } = req.body
  const post = await Post.findById(req.params.id)

  const comment = await Comment.create({
    user: req.user._id,
    post: post._id,
    content
  })

  post.comments.push(comment._id)
  await post.save()

   await Notification.create({
      type: 'comment',
      sender: req.user._id,
      receiver: post.user,
      post: post._id,
    })

  res.redirect('/')
})

router.post("/follow/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login")

    try {
      const userToFollow = await User.findById(req.params.id)
      const currentUser = await User.findById(req.user._id)

      if (!currentUser.following.includes(userToFollow._id)) {
        currentUser.following.push(userToFollow._id)
        userToFollow.followers.push(currentUser._id)

        await currentUser.save()
        await userToFollow.save()

         await Notification.create({
      type: 'follow',
      sender: req.user._id,
      receiver: userToFollow._id,
    })
      }

      res.redirect("/profile/" + userToFollow._id)
    } catch (err) {
      console.error("Follow error:", err)
      res.redirect("/")
    }
})

router.post("/unfollow/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    currentUser.following = currentUser.following.filter(id => !id.equals(userToUnfollow._id));
    userToUnfollow.followers = userToUnfollow.followers.filter(id => !id.equals(currentUser._id));

    await currentUser.save();
    await userToUnfollow.save();

    res.redirect("/profile/" + userToUnfollow._id);
  } catch (err) {
    console.error("Unfollow error:", err);
    res.redirect("/");
  }
});

router.get('/notification', async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/login');

  try {
   const notifications = await Notification.find({ receiver: req.user._id })
  .populate('sender')
  .populate('post')
  .sort({ createdAt: -1 })
  .then(list => list.filter(n => n.type === 'follow' || n.post)); 

    res.render('notifications', {
    notifications,
    currentUser: req.user
   }); 
  } catch (err) {
    console.error("Notification route error:", err);
    res.render('notifications', { notifications: [] });
  }
});

router.post('/upload-profile', isLoggedIn, upload.single("profileImage"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    user.profileImage = req.file.filename
    await user.save()
    res.redirect("/profile")
  } catch (err) {
    console.error (err)
    res.status(500).send("Error uploading image")
  }
})

router.get('/chat/:id', isLoggedIn, async (req, res) => {
  const messages = await Chat.find({
    $or: [
      { sender: req.user._id, receiver: req.params.id },
      { sender: req.params.id, receiver: req.user._id }
    ]
  }).populate('sender').populate('receiver').sort({ createdAt: 1 });

  const receiver = await User.findById(req.params.id);

  res.render('chat', {
    currentUser: req.user,
    receiver,
    messages
  });
});

router.get('/messages', isLoggedIn, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id)
      .populate('followers')
      .populate('following');

    // Combine both followers and following (no duplicates)
    const chatUsersMap = new Map();
    currentUser.followers.forEach(user => chatUsersMap.set(user._id.toString(), user));
    currentUser.following.forEach(user => chatUsersMap.set(user._id.toString(), user));

    const chatUsers = Array.from(chatUsersMap.values());

    res.render('message', {
      currentUser: req.user,
      chatUsers
    });
  } catch (err) {
    console.error("Messages route error:", err);
    res.status(500).send("Could not load message list");
  }
});


router.post('/chat/:id', isLoggedIn, async (req, res) => {
  await Chat.create({
    sender: req.user._id,
    receiver: req.params.id,
    message: req.body.message
  });
  res.redirect('/chat/' + req.params.id);
});


module.exports = router;