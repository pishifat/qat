const express = require('express');
const middlewares = require('../helpers/middlewares');
const chatroomsController = require('../controllers/chatroomsController');

const router = express.Router();

router.get('/', middlewares.optionalLogin, chatroomsController.getList);
router.get('/:id', middlewares.optionalLogin, chatroomsController.getById);

router.post('/:id/messages', middlewares.isLoggedIn, chatroomsController.createMessage);
router.post('/:id/lock', middlewares.isLoggedIn, chatroomsController.lock);
router.post('/:id/unlock', middlewares.isLoggedIn, chatroomsController.unlock);
router.post('/:id/participants/add', middlewares.isLoggedIn, chatroomsController.addParticipants);
router.post('/:id/participants/remove', middlewares.isLoggedIn, chatroomsController.removeParticipant);
router.post('/:id/reveal-self', middlewares.isLoggedIn, chatroomsController.revealSelf);
router.post('/:id/messages/:messageId/delete', middlewares.isLoggedIn, chatroomsController.deleteMessage);
router.post('/:id/messages/:messageId/restore', middlewares.isLoggedIn, chatroomsController.restoreMessage);

module.exports = router;
