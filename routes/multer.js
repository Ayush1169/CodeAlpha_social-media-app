const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

// Multer Storage Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // make sure this folder exists!
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = uuidv4() + ext;
    cb(null, uniqueName);
  }
});

// Optional: File filter to allow only images (jpeg/png)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max file size
});

module.exports = upload;
