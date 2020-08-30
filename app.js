const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config.json');
require('express-async-errors');

// Return the 'new' updated object by default when doing findByIdAndUpdate
mongoose.plugin(schema => {
    schema.pre('findOneAndUpdate', function() {
        if (!('new' in this.options)) {
            this.setOptions({ new: true });
        }
    });
});

const Logger = require('./models/log');
const notifications = require('./helpers/notifications');
const indexRouter = require('./routes/index');
const bnAppRouter = require('./routes/bnApp');
const reportsRouter = require('./routes/reports');
const appEvalRouter = require('./routes/evaluations/appEval');
const bnEvalRouter = require('./routes/evaluations/bnEval').router;
const evalArchiveRouter = require('./routes/evaluations/evalArchive');
const dataCollectionRouter = require('./routes/dataCollection');
const manageReportsRouter = require('./routes/manageReports');
const usersRouter = require('./routes//users/users');
const natRouter = require('./routes/users/nat');
const vetoesRouter = require('./routes/vetoes');
const testSubmissionRouter = require('./routes/testSubmission');
const manageTestRouter = require('./routes/manageTest');
const testResultsRouter = require('./routes/testResults');
const discussionVoteRouter = require('./routes/discussionVote');
const qualityAssuranceRouter = require('./routes/qualityAssurance');
const logsRouter = require('./routes/logs');
const interOpRouter = require('./routes/interOp');
const modRequestsRouter = require('./routes/modRequests');
const evaluationResultsRouter = require('./routes/evaluationResults');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// middlewares and such
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//natdb
mongoose.connect(config.connection, {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'db connection error:'));
db.once('open', function() {
    console.log('natdb connected');
});
app.use(
    session({
        secret: config.session,
        store: new MongoStore({ mongooseConnection: db }),
        resave: false,
        saveUninitialized: false,
        secure: true,
        sameSite: 'lax',
    })
);

app.use('/', indexRouter);
app.use('/bnApps', bnAppRouter);
app.use('/reports', reportsRouter);
app.use('/appEval', appEvalRouter);
app.use('/bnEval', bnEvalRouter);
app.use('/dataCollection', dataCollectionRouter);
app.use('/evalArchive', evalArchiveRouter);
app.use('/manageReports', manageReportsRouter);
app.use('/users', usersRouter);
app.use('/users/nat', natRouter);
app.use('/vetoes', vetoesRouter);
app.use('/testSubmission', testSubmissionRouter);
app.use('/managetest', manageTestRouter);
app.use('/testresults', testResultsRouter);
app.use('/discussionVote', discussionVoteRouter);
app.use('/qualityassurance', qualityAssuranceRouter);
app.use('/logs', logsRouter);
app.use('/interOp', interOpRouter);
app.use('/modrequests', modRequestsRouter);
app.use('/evaluationResults', evaluationResultsRouter);

// catch 404
app.use(function(req, res) {
    res.render('index',{
        layout: false,
        loggedIn: req.session.mongoId,
    });
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
    let customErrorMessage;
    if (err.name == 'DocumentNotFoundError') customErrorMessage = 'Not found';

    if (err instanceof mongoose.Error.ValidationError) {
        // @ts-ignore
        customErrorMessage = err._message + ':';

        const keys = Object.keys(err.errors);

        for (const key of keys) {
            const error = err.errors[key];

            if (error.kind === 'required') {
                customErrorMessage += `\n"${error.path}" is missing.`;
            } else if (error.kind === 'maxlength') {
                // @ts-ignore
                customErrorMessage += `\nMax length for input is ${error.properties.maxlength}.`;
            } else {
                customErrorMessage += '\n' + error.message;
            }
        }
    }

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = {};

    if (req.app.get('env') === 'development') {
        //console.log(err);
        res.locals.error = err;
    }

    // render the error page or return json error obj
    if (req.accepts(['html', 'json']) === 'json') {
        res.json({ error: customErrorMessage || err.message || 'Something went wrong!' });
    } else {
        res.status(err.status || 500);
        res.render('error');
    }

    Logger.generateError(
        err.message,
        err.stack,
        JSON.stringify(err.response),
        req.session.mongoId
    );
});


// server start
const port = process.env.PORT || '3001';
app.set('port', port);

app.listen(port, () => {
    console.log('Listening on ' + port);
    notifications.notifyDeadlines.start();
    notifications.notifyBeatmapReports.start();
    notifications.lowActivityTask.start();
    notifications.notifyQualityAssurance.start();
});

module.exports = app;
