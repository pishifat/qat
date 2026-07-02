const express = require('express');
const middlewares = require('../helpers/middlewares');
const discussionsController = require('../controllers/discussionsController');

const router = express.Router();

router.use(middlewares.isLoggedIn);

router.get('/:id/resolve', discussionsController.resolveRoute);

module.exports = router;
