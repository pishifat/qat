const config = require('./config.json');
const Mongoose = require('mongoose');

Mongoose.connect(config.connection, { useNewUrlParser: true }, async function (error, db) {
    if (error) console.log(error);
    console.log('pass');

    const evaluations = db.collection('evaluations');

    const allEvaluations = await evaluations.find({}).toArray();
    console.log(allEvaluations.length);

    for (const evaluation of allEvaluations) {
        console.log(evaluation.consensus);

        if (evaluation.consensus === 'pass') {
            evaluation.consensus = 'fullBn';
            evaluation.kind = 'currentBn';

            if (evaluation.isLowActivity) {
                evaluation.addition = 'lowActivityWarning';
            }
        } else if (evaluation.consensus === 'probation') {
            evaluation.consensus = 'probationBn';
            evaluation.kind = 'currentBn';
        } else if (evaluation.consensus === 'fail') {
            if (evaluation.resignedOnGoodTerms) {
                evaluation.consensus = 'resignedOnGoodTerms';
                evaluation.kind = 'resignation';
            } else if (evaluation.resignedOnStandardTerms) {
                evaluation.consensus = 'resignedOnStandardTerms';
                evaluation.kind = 'resignation';
            } else {
                evaluation.consensus = 'removeFromBn';
                evaluation.kind = 'currentBn';
            }
        }

        delete evaluation.isLowActivity;
        delete evaluation.resignedOnGoodTerms;
        delete evaluation.resignedOnStandardTerms;
        delete evaluation.isMoveToNat;
        delete evaluation.isMoveToBn;

        await evaluations.replaceOne({
            _id: evaluation._id,
        }, evaluation);
    }

    process.exit();
});