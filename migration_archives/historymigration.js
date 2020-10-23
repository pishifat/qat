const config = require('../config.json');
const Mongoose = require('mongoose');
const User = require('../models/user');
const fs = require('fs');

Mongoose.connect(config.connection, { useNewUrlParser: true }, async function (error, db) {
    if (error) console.log(error);
    console.log('pass');

    const usersDb = db.collection('users');
    const users = await usersDb.find({}).toArray();
    console.log(users.length);

    const buffer = fs.readFileSync('histories.csv');
    const csv = buffer.toString();

    if (!csv) {
        console.log('couldnt read csv');
    }

    const data = csv.split('\r\n');

    for (const user of users) {
        if (user.history.length) {
            const map = user.history.map(h => h.kind);
            const map2 = user.history.map(h => h.group);

            for (let i = 0; i < map.length; i++) {
                if (map[i] == map[i+1] && map2[i] == map2[i]) {
                    console.log(user.username); // check manually
                }

            }

            if (map[map.length-1] == 'joined' && (!user.groups.includes('bn') && !user.groups.includes('nat'))) {
                console.log(user.username); // check manually
            }
        }
    }

    for (const unsplitRow of data) {
        const unfilteredRow = unsplitRow.split(',');
        const row = unfilteredRow.filter(col => col.length);
        const osuId = parseInt(row[0], 10);
        const username = row[1];
        const mode = row[2];
        const user = users.find(u => u.osuId == osuId);

        if (user) {
            if (!user.history.length) {
                for (let i = 3; i < row.length; i++) {
                    const col = row[i];
                    const dateParts = col.split('.');
                    const date = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);
                    const group = 'nat';
                    let kind;

                    if (i % 2) {
                        kind = 'joined';
                    } else {
                        kind = 'left';
                    }

                    user.history.push({
                        date,
                        mode,
                        group,
                        kind,
                        relatedEvaluation: null,
                    });
                }
            } else {
                for (let i = 3; i < row.length; i++) {
                    const col = row[i];
                    const dateParts = col.split('.');
                    const date = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);
                    const group = 'nat';
                    let kind;

                    if (i % 2) {
                        kind = 'joined';
                    } else {
                        kind = 'left';
                    }

                    let skip;

                    for (const history of user.history) {
                        const historyDate = new Date(history.date);
                        let minDate = new Date(historyDate);
                        minDate.setDate(minDate.getDate() - 30);
                        let maxDate = new Date(historyDate);
                        maxDate.setDate(maxDate.getDate() + 30);

                        if (date > minDate && +date < +maxDate && history.group == 'nat') {
                            skip = true;
                        }
                    }

                    if (!skip) {
                        user.history.push({
                            date,
                            mode,
                            group,
                            kind,
                            relatedEvaluation: null,
                        });

                        user.history.sort((a, b) => {
                            if (a.date > b.date) return 1;
                            if (a.date < b.date) return -1;

                            return 0;
                        });
                    }
                }
            }

            console.log(user);

            await usersDb.replaceOne({
                _id: user._id,
            }, user);
        } else {
            const newUser = new User();
            newUser.username = username;
            newUser.osuId = osuId;
            newUser.groups.push('user');

            for (let i = 3; i < row.length; i++) {
                const col = row[i];
                const dateParts = col.split('.');
                const date = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);
                const group = 'nat';
                let kind;

                if (i % 2) {
                    kind = 'joined';
                } else {
                    kind = 'left';
                }

                newUser.history.push({
                    date,
                    mode,
                    group,
                    kind,
                    relatedEvaluation: null,
                });
            }

            console.log(newUser);

            await usersDb.insert(newUser);
        }
    }

    process.exit();
});