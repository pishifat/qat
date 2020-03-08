const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config.json');
require('express-async-errors');
require('./helpers/hbs');

// Return the 'new' updated object by default when doing findByIdAndUpdate
mongoose.plugin(schema => {
    schema.pre('findOneAndUpdate', function() {
        if (!('new' in this.options)) {
            this.setOptions({ new: true });
        }
    });
});

const notifications = require('./helpers/notifications');
const indexRouter = require('./routes/index');
const bnAppRouter = require('./routes/bnApp');
const reportsRouter = require('./routes/reports');
const appEvalRouter = require('./routes/appEval');
const bnEvalRouter = require('./routes/bnEval');
const dataCollectionRouter = require('./routes/dataCollection');
const evalArchiveRouter = require('./routes/evalArchive');
const manageReportsRouter = require('./routes/manageReports');
const usersRouter = require('./routes/users');
const vetoesRouter = require('./routes/vetoes');
const testSubmissionRouter = require('./routes/testSubmission');
const manageTestRouter = require('./routes/manageTest');
const testResultsRouter = require('./routes/testResults');
const discussionVoteRouter = require('./routes/discussionVote');
const bnScoreRouter = require('./routes/bnScore');
const qualityAssuranceRouter = require('./routes/qualityAssurance');
const logsRouter = require('./routes/logs');

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
app.use('/vetoes', vetoesRouter);
app.use('/testSubmission', testSubmissionRouter);
app.use('/managetest', manageTestRouter);
app.use('/testresults', testResultsRouter);
app.use('/discussionVote', discussionVoteRouter);
app.use('/bnscore', bnScoreRouter);
app.use('/qualityassurance', qualityAssuranceRouter);
app.use('/logs', logsRouter);

// catch 404
app.use(function(req, res) {
    res.status(404).redirect('/');
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function(err, req, res, next) {
    if (err.name == 'DocumentNotFoundError') err.message = 'Not found';

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page or return error obj for json
    if (req.accepts(['html', 'json']) === 'json') {
        res.json({ error: err.message || 'Something went wrong!' });
    } else {
        res.status(err.status || 500);
        res.render('error');
    }
});


// server start
const port = process.env.PORT || '3001';
app.set('port', port);

const server = http.createServer(app);

server.listen(port);
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(port + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(port + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});
server.on('listening', () => {
    console.log('Listening on ' + port);
    notifications.notifyDeadlines();
    notifications.notifyBeatmapReports();
    notifications.lowActivityTask.start();
});

module.exports = app;
