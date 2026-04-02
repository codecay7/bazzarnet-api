import multer from 'multer';
// Removed path and fileURLToPath as they are no longer needed for disk storage

// Set storage engine to memoryStorage
const storage = multer.memoryStorage(); // Store files in memory as a Buffer

// Check file type to allow only images (Multer's fileFilter)
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|svg/;
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb('Images only!');
  }
}

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});

export default upload;