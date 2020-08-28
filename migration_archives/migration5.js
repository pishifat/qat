const config = require('../config.json');
const Mongoose = require('mongoose');

Mongoose.connect(config.connection, { useNewUrlParser: true }, async function (error, db) {
    if (error) console.log(error);
    console.log('pass');

    const appevaluations = db.collection('appevaluations');
    console.log(await appevaluations.updateMany({}, {
        $rename: {
            consensusSetAt: 'archivedAt',
        },
    }));

    const evaluations = db.collection('evaluations');
    console.log(await evaluations.updateMany({}, {
        $rename: {
            consensusSetAt: 'archivedAt',
        },
    }));

    process.exit();
});