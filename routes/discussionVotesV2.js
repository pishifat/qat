const express = require('express');
const middlewares = require('../helpers/middlewares');
const discussionVotesController = require('../controllers/discussionVotesController');

const router = express.Router();

router.use(middlewares.isLoggedIn);

router.get('/', discussionVotesController.getList);
router.get('/:id', discussionVotesController.getById);

module.exports = router;
