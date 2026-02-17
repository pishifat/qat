const express = require('express');
const Aiess = require('../models/aiess');
const User = require('../models/user');
const Logger = require('../models/log');
const middlewares = require('../helpers/middlewares');

const router = express.Router();

/* GET user's ranked nominations for a specific month */
router.get('/:id/rankedNominations/:year/:month', middlewares.isLoggedIn, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).orFail();

        if (req.session.mongoId != user.id) {
            return res.json({ error: 'Unauthorized' });
        }

        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month) - 1; // Month is 0-indexed in Date constructor

        if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
            return res.json({ error: 'Invalid year or month' });
        }

        // Create date range for ranked maps in the specified month
        const rankStartDate = new Date(year, month, 1);
        const rankEndDate = new Date(year, month + 1, 0); // Last day of the month

        // Look back 1 year for nominations prior to the rank month
        const nominationStartDate = new Date(year - 1, month, 1);
        const nominationEndDate = rankEndDate;

        // Get unique user events (nominations/qualifications) from the past year
        const modes = user.modes.length && !user.modes.includes('none')
            ? user.modes
            : ['osu', 'taiko', 'catch', 'mania'];

        const uniqueUserEvents = await Aiess.getUniqueUserEvents(
            user.osuId,
            nominationStartDate,
            nominationEndDate,
            modes,
            ['nominate', 'qualify']
        );

        if (!uniqueUserEvents || uniqueUserEvents.length === 0) {
            return res.json({ events: [] });
        }

        // Extract beatmapset IDs
        const beatmapsetIds = uniqueUserEvents.map(event => event.beatmapsetId);

        // Find corresponding rank events for these beatmapsets that ranked in the specified month
        const rankEvents = await Aiess
            .find({
                beatmapsetId: { $in: beatmapsetIds },
                type: 'rank',
                timestamp: { $gte: rankStartDate, $lte: rankEndDate },
            })
            .sort({ timestamp: -1 });

        res.json({
            events: rankEvents,
            month: req.params.month,
            year: req.params.year,
        });
    } catch (error) {
        console.error('Error fetching ranked nominations:', error);
        res.json({ error: 'Failed to fetch ranked nominations' });
    }
});

/* GET charted events for a specific month */
router.get('/month/:year/:month', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month) - 1; // Month is 0-indexed in Date constructor
        let mode = req.query.mode || 'osu';

        if (isNaN(year) || isNaN(month) || month < 0 || month > 11) {
            return res.json({ error: 'Invalid year or month' });
        }

        // Default 'none' mode to 'osu'
        if (mode === 'none') {
            mode = 'osu';
        }

        if (!['osu', 'taiko', 'catch', 'mania'].includes(mode)) {
            return res.json({ error: 'Invalid mode' });
        }

        // Create date range for the specified month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0); // Last day of the month

        // Find events that are charted and within the date range, filtered by mode
        const chartedEvents = await Aiess
            .find({
                timestamp: { $gte: startDate, $lte: endDate },
                charted: { $exists: true, $ne: [] },
                type: 'rank',
                modes: mode,
            })
            .populate('charted', 'username osuId')
            .sort({ timestamp: -1 });

        res.json({
            events: chartedEvents,
            month: req.params.month,
            year: req.params.year,
            mode,
        });

    } catch (error) {
        console.error('Error fetching charted events:', error);
        res.json({ error: 'Failed to fetch charted events' });
    }
});

/* POST toggle chart selection for an Aiess event */
router.post('/:eventId/toggleSelection', middlewares.isLoggedIn, async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.session.mongoId;

        if (!eventId) {
            return res.json({ error: 'Event ID is required' });
        }

        const event = await Aiess.findById(eventId);

        if (!event) {
            return res.json({ error: 'Event not found' });
        }

        // Initialize arrays if they don't exist
        if (!event.charted) {
            event.charted = [];
        }

        if (!event.chartUpvoted) {
            event.chartUpvoted = [];
        }

        const userIndex = event.charted.indexOf(userId);
        const upvoteIndex = event.chartUpvoted.findIndex(id => id.toString() === userId.toString());
        let isSelected = false;

        if (userIndex === -1) {
            // User hasn't selected this event, add them to both charted and chartUpvoted
            event.charted.push(userId);

            if (upvoteIndex === -1) {
                event.chartUpvoted.push(userId);
            }

            isSelected = true;
        } else {
            // User has selected this event, remove them from both charted and chartUpvoted
            event.charted.splice(userIndex, 1);

            if (upvoteIndex !== -1) {
                event.chartUpvoted.splice(upvoteIndex, 1);
            }

            isSelected = false;
        }

        await event.save();

        res.json({
            isSelected,
            eventId: event._id,
        });

        Logger.generate(
            req.session.mongoId,
            `${isSelected ? 'Selected' : 'Deselected'} chart for beatmapset ${event.beatmapsetId}`,
            'charts',
            event._id
        );

    } catch (error) {
        console.error('Error toggling chart selection:', error);
        res.json({ error: 'Failed to toggle selection' });
    }
});

/* POST upvote/downvote a charted event */
router.post('/:eventId/vote', middlewares.isLoggedIn, middlewares.isBnOrNat, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { voteType } = req.body; // 'up' or 'down'
        const userId = req.session.mongoId;

        if (!eventId || !voteType || !['up', 'down'].includes(voteType)) {
            return res.json({ error: 'Invalid parameters' });
        }

        const event = await Aiess.findById(eventId);

        if (!event) {
            return res.json({ error: 'Event not found' });
        }

        // Initialize vote arrays if they don't exist
        if (!event.chartUpvoted) event.chartUpvoted = [];
        if (!event.chartDownvoted) event.chartDownvoted = [];

        const upvoteIndex = event.chartUpvoted.indexOf(userId);
        const downvoteIndex = event.chartDownvoted.indexOf(userId);

        let action = '';

        if (voteType === 'up') {
            // Remove from downvotes if present
            if (downvoteIndex !== -1) {
                event.chartDownvoted.splice(downvoteIndex, 1);
            }

            // Toggle upvote
            if (upvoteIndex === -1) {
                event.chartUpvoted.push(userId);
                action = 'upvoted';
            } else {
                event.chartUpvoted.splice(upvoteIndex, 1);
                action = 'removed_upvote';
            }
        } else { // voteType === 'down'
            // Remove from upvotes if present
            if (upvoteIndex !== -1) {
                event.chartUpvoted.splice(upvoteIndex, 1);
            }

            // Toggle downvote
            if (downvoteIndex === -1) {
                event.chartDownvoted.push(userId);
                action = 'downvoted';
            } else {
                event.chartDownvoted.splice(downvoteIndex, 1);
                action = 'removed_downvote';
            }
        }

        await event.save();

        res.json({
            action,
            upvoteCount: event.chartUpvoted.length,
            downvoteCount: event.chartDownvoted.length,
            userUpvoted: event.chartUpvoted.includes(userId),
            userDownvoted: event.chartDownvoted.includes(userId),
        });

        Logger.generate(
            req.session.mongoId,
            `${action} chart for beatmapset ${event.beatmapsetId}`,
            'charts',
            event._id
        );

    } catch (error) {
        console.error('Error voting on chart:', error);
        res.json({ error: 'Failed to vote' });
    }
});

module.exports = router;