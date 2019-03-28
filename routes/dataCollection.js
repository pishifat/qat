const express = require('express');
const aiess = require('../models/aiess.js');
const api = require('../models/api.js');

const router = express.Router();

router.use(api.isLoggedIn);

/* GET eval archive page */
router.get('/', async (req, res, next) => {
    res.render('datacollection', { 
        title: 'Data Collection', 
        script: '../javascripts/dataCollection.js', 
        isEval: true, 
        isBnOrNat: res.locals.userRequest.group == 'bn' || res.locals.userRequest.group == 'nat',
        isNat: res.locals.userRequest.group == 'nat'
    });
});


/* GET dq/pop listing */
router.get('/relevantInfo', async (req, res, next) => {
    let date = new Date();
    date.setDate(date.getDate() - 90);
    let dqs = await aiess.service.query({eventType: 'Disqualified', timestamp: { $gte: date }}, {}, {timestamp: 1}, true);
    let pops = await aiess.service.query({eventType: 'Popped', timestamp: { $gte: date }}, {}, {timestamp: 1}, true);
    res.json({ dqs: dqs, pops: pops });
});


/* POST edit reason for dq/pop */
router.post('/updateReason/:id', async (req, res) => {
    let a = await aiess.service.update(req.params.id, {content: req.body.reason});
    if(!a){
        return res.json( { error: 'Something went wrong'} );
    }else{
        return res.json(a);
    }
});

/* POST edit validity */
router.post('/updateValidity/:id', async (req, res) => {
    let a = await aiess.service.update(req.params.id, {valid: req.body.validity});
    if(!a){
        return res.json( { error: 'Something went wrong'} );
    }else{
        return res.json(a);
    }
});



module.exports = router;
