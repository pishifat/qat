const config = require('../config.json');
const Mongoose = require('mongoose');

Mongoose.connect(config.connection, { useNewUrlParser: true }, async function (error, db) {
    if (error) console.log(error);
    console.log('pass');

    const events = db.collection('aiess');
    console.log(await events.updateMany({}, {
        $rename: {
            eventType: 'type',
            //timestamp: 'time',
            hostId: 'creatorId',
            hostName: 'creatorName',
            postId: 'discussionId',
            metadata: 'artistTitle',
        },
    }));

    const allEvents = await events.find({}).toArray();
    console.log(allEvents.length);

    for (const event of allEvents) {
        console.log(event.artistTitle ? event.artistTitle : event.metadata);

        switch (event.type) {
            case 'Ranked':
                event.type = 'rank';
                break;
            case 'Loved':
                event.type = 'love';
                break;
            case 'Qualified':
                event.type = 'qualify';
                break;
            case 'Disqualified':
                event.type = 'disqualify';
                break;
            case 'Bubbled':
                event.type = 'nominate';
                break;
            case 'Popped':
                event.type = 'nomination_reset';
                break;
            default:
                event.type = null;
        }

        await events.replaceOne({
            _id: event._id,
        }, event);
    }

    process.exit();
});