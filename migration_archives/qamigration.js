const config = require('../config.json');
const Mongoose = require('mongoose');
const qualityAssuranceCheck = require('../models/qualityAssuranceCheck');
const { user } = require('../models/evaluations/base');

Mongoose.connect(config.connection, { useNewUrlParser: true }, async function (error, db) {
    if (error) console.log(error);
    console.log('pass');

    const aiess = db.collection('aiess');
    const events = await aiess.find({}).toArray();
    console.log(events.length);

    const mediationsDb = db.collection('mediations');
    const mediations = await mediationsDb.find({}).toArray();
    console.log(mediations.length);

    const qualityAssuranceChecksDb = db.collection('qualityassurancechecks');
    const qualityAssuranceChecks = await qualityAssuranceChecksDb.find({}).toArray();
    console.log(qualityAssuranceChecks.length);

    for (const event of events) {

        console.log(event.beatmapsetId);

        if (event.qualityAssuranceCheckers && event.qualityAssuranceCheckers.length) {
            let qaCommentIds = [];

            if (event.qualityAssuranceComments && event.qualityAssuranceComments.length) {
                qaCommentIds = event.qualityAssuranceComments.map(q => q.toString());
            }

            const relevantComments = mediations.filter(m => qaCommentIds.includes(m._id.toString()));

            for (const userId of event.qualityAssuranceCheckers) {
                const newQa = new qualityAssuranceCheck();
                newQa.user = userId;
                newQa.event = event._id;
                newQa.timestamp = new Date(event.updatedAt);
                newQa.mode = event.modes[0];

                if (user.modes && !user.modes.includes(newQa.mode) && user.modes.length == 1) {
                    newQa.mode = user.modes[0];
                }

                const mediation = relevantComments.find(m => m.mediator.toString() == userId.toString());

                if (mediation) {
                    newQa.comment = mediation.comment;
                    newQa.timestamp = new Date(mediation.createdAt);
                }

                console.log(newQa);

                await qualityAssuranceChecksDb.insertOne(newQa);
            }
        }

        delete event.qualityAssuranceCheckers;
        delete event.qualityAssuranceComments;

        aiess.replaceOne({
            _id: event._id,
        }, event);
    }

    process.exit();
});