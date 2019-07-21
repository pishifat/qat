const express = require('express');
const api = require('../models/api');
const logsService = require('../models/log').service;
const usersService = require('../models/user').service;
const evalsService = require('../models/evaluation').service;

const router = express.Router();

router.use(api.isLoggedIn);
router.use(api.isNat);

const defaultPopulate = [{ populate: 'user', display: 'username' }];

/* GET logs */
router.get('/', async (req, res, next) => {
    res.render('logs', {
        title: 'Logs',
        script: '../js/logs.js',
        isLogs: true,
        logs: await logsService.query(
            { isError: { $ne: true } },
            defaultPopulate,
            { createdAt: -1 },
            true,
            100
        ),
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isNat: res.locals.userRequest.group == 'nat' || res.locals.userRequest.isSpectator,
        isAdmin: req.session.osuId == 1052994 || req.session.osuId == 3178418 || res.locals.userRequest.isLeader,
    });
});

router.get('/more/:skip', async (req, res, next) => {
    res.json(
        await logsService.query({}, defaultPopulate, { createdAt: -1 }, true, 100, parseInt(req.params.skip))
    );
});

router.get('/showErrors', async (req, res, next) => {
    if (req.session.osuId == 1052994 || req.session.osuId == 3178418) {
        res.json(
            await logsService.query({ isError: true }, defaultPopulate, { createdAt: -1 }, true, 100, parseInt(req.params.skip))
        );
    } else {
        res.redirect('/');
    }
});

router.get('/getNatActivity', async (req, res, next) => {
    let users = await usersService.query({ group: 'nat' }, {}, {}, true);
    let evaluations = await evalsService.query({}, {}, {}, true);

    class obj 
    {
        constructor(username, totalEvaluations) 
        {
            this.username = username;
            this.totalEvaluations = totalEvaluations;
        }
    }

    let minDate = new Date();
    minDate.setDate(minDate.getDate() - 60);
    let info = [];
    users.forEach(user => {
        let count = 0;
        evaluations.forEach(evaluation => {
            if(evaluation.evaluator.toString() == user.id && evaluation.createdAt > minDate){
                count++;
            }     
        });
        info.push(new obj(user.username, count));
    });
    
    //this is not done yet

    res.json(info);
});

module.exports = router;
