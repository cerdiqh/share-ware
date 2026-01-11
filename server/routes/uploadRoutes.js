const path = require('path');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();

// Max upload size 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// --- Configure Multer for storage ---
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Save files to the 'uploads' folder
  },
  filename(req, file, cb) {
    // Create a unique filename to avoid conflicts
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// --- File validation ---
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only! (jpg, jpeg, png)'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// --- Define the upload endpoint ---
// @route   POST /api/upload
// @desc    Upload an image file
// @access  Public (can be changed to protected if needed)
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ message: 'No files uploaded' });

    const serverOrigin = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5001}`;
    const results = [];

    for (const file of req.files) {
      const fullPath = file.path;
      const resizedPath = `${fullPath}-resized${path.extname(fullPath)}`;
      const thumbPath = `${fullPath}-thumb${path.extname(fullPath)}`;

      // Resize main image
      await sharp(fullPath)
        .resize({ width: 1024, withoutEnlargement: true })
        .toFile(resizedPath);

      // Create thumbnail (300px width)
      await sharp(fullPath)
        .resize({ width: 300, withoutEnlargement: true })
        .toFile(thumbPath);

      // Replace original with resized
      await fs.promises.unlink(fullPath);
      await fs.promises.rename(resizedPath, fullPath);

      // Normalize and build urls
      const filePath = fullPath.split(path.sep).join('/');
      const thumbFilePath = thumbPath.split(path.sep).join('/');
      const imageUrl = `${serverOrigin}/${filePath}`.replace(/([^:]\/)\/+/g, '$1');
      const thumbUrl = `${serverOrigin}/${thumbFilePath}`.replace(/([^:]\/)\/+/g, '$1');

      results.push({ image: imageUrl, thumbnail: thumbUrl });
    }

    res.send({ message: 'Images Uploaded', images: results });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Image processing failed' });
  }
});

module.exports = router;
