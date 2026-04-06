const chatroomsService = require('../services/chatroomsService');

function handleError(res, error) {
    return res.status(error.status || 500).json({
        error: error.message || 'Something went wrong!',
    });
}

/**
 * GET chatrooms list for a target
 * @route GET /api/v2/chatrooms
 */
async function getList(req, res) {
    try {
        const type = req.query.type;
        const targetId = req.query.targetId;
        const viewer = res.locals.userRequest || null;

        if (!type || !targetId) {
            return res.status(400).json({ error: 'type and targetId are required.' });
        }

        const chatrooms = await chatroomsService.listRoomsByTarget(type, targetId, viewer);

        res.json({ chatrooms });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * GET specific chatroom
 * @route GET /api/v2/chatrooms/:id
 */
async function getById(req, res) {
    try {
        const viewer = res.locals.userRequest || null;
        const chatroom = await chatroomsService.getRoomById(req.params.id, viewer);

        if (!chatroom) {
            return res.status(404).json({ error: 'Chatroom not found' });
        }

        res.json({ chatroom });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * POST send chatroom message
 * @route POST /api/v2/chatrooms/:id/messages
 */
async function createMessage(req, res) {
    try {
        const chatroom = await chatroomsService.createMessage(req.params.id, req.body, res.locals.userRequest);
        res.json({
            chatroom,
            success: 'Message sent.',
        });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * POST lock chatroom
 * @route POST /api/v2/chatrooms/:id/lock
 */
async function lock(req, res) {
    try {
        const chatroom = await chatroomsService.setRoomLockState(req.params.id, true, res.locals.userRequest);
        res.json({
            chatroom,
            success: 'Chatroom locked.',
        });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * POST unlock chatroom
 * @route POST /api/v2/chatrooms/:id/unlock
 */
async function unlock(req, res) {
    try {
        const chatroom = await chatroomsService.setRoomLockState(req.params.id, false, res.locals.userRequest);
        res.json({
            chatroom,
            success: 'Chatroom unlocked.',
        });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * POST add chatroom participants
 * @route POST /api/v2/chatrooms/:id/participants/add
 */
async function addParticipants(req, res) {
    try {
        const chatroom = await chatroomsService.addParticipants(req.params.id, req.body, res.locals.userRequest);
        res.json({
            chatroom,
            success: 'Participants updated.',
        });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * POST remove chatroom participant
 * @route POST /api/v2/chatrooms/:id/participants/remove
 */
async function removeParticipant(req, res) {
    try {
        const chatroom = await chatroomsService.removeParticipant(
            req.params.id,
            req.body.userId,
            res.locals.userRequest
        );

        res.json({
            chatroom,
            success: 'Participant removed.',
        });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * POST reveal current user's identity
 * @route POST /api/v2/chatrooms/:id/reveal-self
 */
async function revealSelf(req, res) {
    try {
        const chatroom = await chatroomsService.revealSelf(req.params.id, res.locals.userRequest);
        res.json({
            chatroom,
            success: 'Your identity will now be shown in future messages.',
        });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * POST delete chatroom message
 * @route POST /api/v2/chatrooms/:id/messages/:messageId/delete
 */
async function deleteMessage(req, res) {
    try {
        const chatroom = await chatroomsService.deleteMessage(
            req.params.id,
            req.params.messageId,
            res.locals.userRequest
        );

        res.json({
            chatroom,
            success: 'Message deleted.',
        });
    } catch (error) {
        return handleError(res, error);
    }
}

/**
 * POST restore chatroom message
 * @route POST /api/v2/chatrooms/:id/messages/:messageId/restore
 */
async function restoreMessage(req, res) {
    try {
        const chatroom = await chatroomsService.restoreMessage(
            req.params.id,
            req.params.messageId,
            res.locals.userRequest
        );

        res.json({
            chatroom,
            success: 'Message restored.',
        });
    } catch (error) {
        return handleError(res, error);
    }
}

module.exports = {
    getList,
    getById,
    createMessage,
    lock,
    unlock,
    addParticipants,
    removeParticipant,
    revealSelf,
    deleteMessage,
    restoreMessage,
};
