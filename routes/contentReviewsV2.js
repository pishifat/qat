const express = require('express');
const middlewares = require('../helpers/middlewares');
const contentReviewsController = require('../controllers/contentReviewsController');

const router = express.Router();

router.use(middlewares.isLoggedIn);

router.get('/', contentReviewsController.getList);
router.get('/:id', contentReviewsController.getById);

module.exports = router;
