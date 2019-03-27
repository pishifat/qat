var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config.json');
const hbs = require('hbs');

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
const bnScoreRouter = require('./routes/bnScore');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//natdb
const db = mongoose.createConnection(config.connection, { useNewUrlParser: true });
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

app.use('/qat', indexRouter);
app.use('/nat/bnApps', bnAppRouter);
app.use('/nat/reports', reportsRouter);
app.use('/nat/appEval', appEvalRouter);
app.use('/nat/bnEval', bnEvalRouter);
app.use('/nat/dataCollection', dataCollectionRouter);
app.use('/nat/evalArchive', evalArchiveRouter);
app.use('/nat/manageReports', manageReportsRouter);
app.use('/nat/users', usersRouter);
app.use('/nat/vetoes', vetoesRouter);
app.use('/nat/testSubmission', testSubmissionRouter);
app.use('/nat/managetest', manageTestRouter);
app.use('/nat/bnscore', bnScoreRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
