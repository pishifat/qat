const config = require('./config.json');
const Mongoose = require('mongoose');

Mongoose.connect(config.connection, { useNewUrlParser: true }, async function (error, db) {
    if (error) console.log(error);
    console.log('pass');

    const vetoes = db.collection('vetos');

    const allVetoes = await vetoes.find({}).toArray();
    console.log(allVetoes.length);

    for (const veto of allVetoes) {
        console.log(veto.beatmapTitle);

        const reasons = [{
            link: veto.discussionLink,
            summary: veto.shortReason,
        }];

        delete veto.discussionLink;
        delete veto.shortReason;
        veto.reasons = reasons;
        await vetoes.replaceOne({
            _id: veto._id,
        }, veto);
    }

    process.exit();
});