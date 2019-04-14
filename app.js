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
const testResultsRouter = require('./routes/testResults');
const bnScoreRouter = require('./routes/bnScore');
const logsRouter = require('./routes/logs');

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
mongoose.connect(config.connection, { useFindAndModify: false, useNewUrlParser: true });
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
app.use('/bnscore', bnScoreRouter);
app.use('/logs', logsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  if (createError(404)) {
    res.redirect('/');
  }
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

//handlebar helper
hbs.registerHelper('shortDate', function(date) {
  return date.toString().slice(4, 24);
});

hbs.registerHelper('shortAction', function(action) {
  if(action.length > 120){
      return action.toString().slice(0, 120) + "...";
  }else{
      return action;
  }
});

module.exports = app;
