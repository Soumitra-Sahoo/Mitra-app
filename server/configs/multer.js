import multer from 'multer'

const storage = multer.memoryStorage();

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!/^(image|video)\//.test(file.mimetype)) {
            return cb(new Error('Only image or video files are allowed'));
        }
        cb(null, true);
    },
});

export const uploadStoryMedia = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!/^(image|video)\//.test(file.mimetype)) {
            return cb(new Error('Only image or video files are allowed'));
        }
        cb(null, true);
    },
});