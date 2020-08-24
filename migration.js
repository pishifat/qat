const config = require('./config.json');
const Mongoose = require('mongoose');

// rename evaluations > reviews collection first

Mongoose.connect(config.connection, { useNewUrlParser: true }, async function (error, db) {
    if (error) console.log(error);
    console.log('pass');

    const bnapps = db.collection('bnapps');
    console.log(await bnapps.updateMany({}, {
        $rename: {
            evaluations: 'reviews',
            applicant: 'user',
        },
    }));

    const evalrounds = db.collection('evalrounds');
    console.log(await evalrounds.updateMany({}, {
        $rename: {
            evaluations: 'reviews',
            bn: 'user',
        },
    }));

    const users = db.collection('users');
    console.log(await users.updateMany({}, {
        $rename: {
            vetoMediator: 'isVetoMediator',
        },
    }));

    const allUsers = await users.find({}).toArray();
    console.log(allUsers.length);

    for (const user of allUsers) {
        console.log(user.username);

        // Groups
        const groups = [user.group] || ['user'];

        if (!groups.includes('user')) {
            groups.push('user');
        }

        if (user.isSpectator) {
            groups.push('gmt');
        }

        user.groups = groups;

        // Modes
        const modesInfo = [];

        for (const mode of user.probation) {
            modesInfo.push({
                mode,
                level: 'probation',
            });
        }

        for (const mode of user.modes) {
            if (!user.probation.includes(mode)) {
                modesInfo.push({
                    mode,
                    level: 'full',
                });
            }
        }

        user.modesInfo = modesInfo;

        // History
        const historyArr = [];

        for (let i = 0; i < user.bnDuration.length; i++) {
            const date = user.bnDuration[i];
            const history = {};
            history.date = date;
            history.mode = user.modes[0];
            history.group = 'bn';

            if (i % 2 == 0) {
                history.kind = 'joined';
            } else {
                history.kind = 'left';
            }

            historyArr.push(history);
        }

        for (let i = 0; i < user.natDuration.length; i++) {
            const date = user.natDuration[i];
            const history = {};
            history.date = date;
            history.mode = user.modes[0];
            history.group = 'nat';

            if (i % 2 == 0) {
                history.kind = 'joined';
            } else {
                history.kind = 'left';
            }

            historyArr.push(history);
        }

        delete user.group;
        delete user.isSpectator;
        delete user.vetoMediator;
        delete user.modes;
        delete user.probation;
        delete user.bnDuration;
        delete user.natDuration;
        user.history = historyArr;
        await users.replaceOne({
            _id: user._id,
        }, user);
    }

    process.exit();
});