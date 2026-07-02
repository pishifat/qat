const express = require('express');
const multer = require('multer');
const middlewares = require('../helpers/middlewares');
const contentReviewsController = require('../controllers/contentReviewsController');
const imageFingerprintService = require('../services/imageFingerprintService');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: imageFingerprintService.MAX_BYTES,
        files: 1,
    },
});

router.use(middlewares.isLoggedIn);

router.post('/image-search', middlewares.hasBasicAccess, upload.single('image'), contentReviewsController.imageSearch);

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.json({ error: 'Image must be 25MB or smaller' });
        }

        return res.json({ error: err.message });
    }

    return next(err);
});

router.get('/', contentReviewsController.getList);
router.get('/:id', contentReviewsController.getById);

module.exports = router;
