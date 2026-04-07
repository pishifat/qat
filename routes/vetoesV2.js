const express = require('express');
const middlewares = require('../helpers/middlewares');
const vetoesController = require('../controllers/vetoesController');

const router = express.Router();

router.use(middlewares.isLoggedIn);

router.get('/', vetoesController.getList);
router.get('/:id', vetoesController.getById);
router.post('/:id/chatrooms/post-mediation', vetoesController.createPostMediationChatroom);
router.post('/:id/chatrooms', vetoesController.createChatroom);

module.exports = router;
