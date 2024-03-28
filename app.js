const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const middlewares = require("./helpers/middlewares")
const logger = require('morgan');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const config = require('./config.json');
const ws = require("ws");
const crypto = require("crypto")
require('express-async-errors');

// Return the 'new' updated object by default when doing findByIdAndUpdate
mongoose.plugin(schema => {
    schema.pre('findOneAndUpdate', function () {
        if (!('new' in this.options)) {
            this.setOptions({ new: true });
        }
    });
});

const Logger = require('./models/log');
const automation = require('./helpers/automation');
const indexRouter = require('./routes/index');
const bnAppRouter = require('./routes/bnApp');
const reportsRouter = require('./routes/reports');
const appEvalRouter = require('./routes/evaluations/appEval');
const bnEvalRouter = require('./routes/evaluations/bnEval').router;
const evalArchiveRouter = require('./routes/evaluations/evalArchive');
const yourEvalsRouter = require('./routes/evaluations/yourEvals');
const dataCollectionRouter = require('./routes/dataCollection');
const manageReportsRouter = require('./routes/manageReports');
const usersRouter = require('./routes//users/users');
const natRouter = require('./routes/users/nat');
const vetoesRouter = require('./routes/vetoes');
const discussionVoteRouter = require('./routes/discussionVote');
const qualityAssuranceRouter = require('./routes/qualityAssurance');
const logsRouter = require('./routes/logs');
const interOpRouter = require('./routes/interOp');
const modRequestsRouter = require('./routes/modRequests');
const messageRouter = require('./routes/message');
const settingsRouter = require('./routes/settings');
const spamRouter = require('./routes/spam');
const debugRouter = require('./routes/debug');
const groupHistoryRouter = require('./routes/groupHistory');
const { websocketManager } = require('./helpers/websocket');

const app = express();

global.ws = []; // array to access websocket clients
const wsServer = new ws.Server({ noServer: true, path: "/websocket/interOp" });

wsServer.on("connection", (socket, request) => {
  console.log(
    `${
      request.headers["x-forwarded-for"] || request.socket.remoteAddress
    } is connected via websocket`);
});

// discord embeds
app.use(middlewares.discordEmbeds);

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
db.once('open', function () {
    console.log('natdb connected');
});

const sessionConfig = {
    name: 'bnsite_session',
    secret: config.session,
    store: new MongoStore({ mongooseConnection: db }),
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: 'lax',
        httpOnly: true,
    },
};

if (app.get('env') === 'production') {
    app.set('trust proxy', 1);
    sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));

app.use('/', indexRouter);
app.use('/bnApps', bnAppRouter);
app.use('/reports', reportsRouter);
app.use('/appEval', appEvalRouter);
app.use('/bnEval', bnEvalRouter);
app.use('/dataCollection', dataCollectionRouter);
app.use('/evalArchive', evalArchiveRouter);
app.use('/yourEvals', yourEvalsRouter);
app.use('/manageReports', manageReportsRouter);
app.use('/users', usersRouter);
app.use('/users/nat', natRouter);
app.use('/vetoes', vetoesRouter);
app.use('/discussionVote', discussionVoteRouter);
app.use('/qualityassurance', qualityAssuranceRouter);
app.use('/logs', logsRouter);
app.use('/interOp', interOpRouter);
app.use('/modrequests', modRequestsRouter);
app.use('/message', messageRouter);
app.use('/settings', settingsRouter);
app.use('/spam', spamRouter);
app.use('/debug', debugRouter);
app.use('/groupHistory', groupHistoryRouter);

// catch 404
app.use(function (req, res) {
    res.render('index', {
        layout: false,
        loggedIn: req.session.mongoId,
    });
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
    let customErrorMessage;
    if (err.name == 'DocumentNotFoundError') customErrorMessage = 'Not found';

    if (err instanceof mongoose.Error.ValidationError) {
        // @ts-ignore
        customErrorMessage = err._message + ':';

        const keys = Object.keys(err.errors);

        for (const key of keys) {
            const error = err.errors[key];

            // @ts-ignore
            if (error.kind === 'required') {
                // @ts-ignore
                customErrorMessage += `\n"${error.path}" is missing.`;
                // @ts-ignore
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

const server = app.listen(port, () => {
    console.log('Listening on ' + port);

    if (config.enableAutomation) {
        //automation.notifyDeadlines.start();
        automation.lowActivityTask.start();
        automation.handleContentReviews.start();
        automation.checkBnEvaluationDeadlines.start();
        automation.lowActivityPerUserTask.start();
        automation.checkTenureValidity.start();
        automation.badgeTracker.start();
        automation.notifyBeatmapReports.start();
        automation.spawnProbationEvaluations.start();
        //automation.validateEvents.start();
    }
});

// setup websocket
server.on("upgrade", (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (socket, request) => {
      const secret = request.headers?.secret;
      const username = request.headers?.username;
      const tags = request.headers?.tags;
  
      if (!config.interOpAccess[username?.toString()])
        return sendError(401, "User not found!");
  
      if (!tags || tags.toString().split("+").length == 0)
        return sendError(400, "Provide valid tags to listen to!");
  
      if (
        !secret ||
        !username ||
        config.interOpAccess[username?.toString()].secret !== secret
      )
        return sendError(401, "Invalid key!");
  
      function sendError(code, text) {
        socket.send(
          JSON.stringify({
            status: code,
            statusText: text,
          })
        );
  
        socket.close();
      }
  
      const socketId = crypto.randomBytes(25).toString("hex");
  
      const stopPingListener = () => {
          const socketIndex = global.ws.findIndex((s) => s.id == socketId);
  
          if (socketIndex == -1) return;
  
          if (global.ws[socketIndex]) {
              clearInterval(global.ws[socketIndex].pingInterval)
  
              return console.log(`Stop ping listener for ${request.headers['x-forwarded-for'] || request.socket.remoteAddress}`);
          }
      }
  
      (global.ws || []).push({
        tags: sanitizeTags(tags),
        ws: socket,
        pingInterval: setInterval(() => {
          socket.send(JSON.stringify({
              type: "PING",
              data: null
          }), (err) => {
              if (err) return stopPingListener;
  
              return console.log(`Sent ping for ${request.headers['x-forwarded-for'] || request.socket.remoteAddress}`);
          })
        }, 300000), // Ping at every 5 minutes
        id: socketId,
      });
  
      socket.onclose = stopPingListener;
  
      wsServer.emit("connection", socket, request);
    });
  
    function sanitizeTags(requestTags) {
      const tags = requestTags.toString().split("+");
      const availableTags = websocketManager.availableTags;
      const sanitizedTags = tags
        .map((t) => (t || "").toLowerCase().trim())
        .filter((t) => t.trim().toLowerCase() != "")
        .filter((t) => availableTags.includes(t));
  
      return sanitizedTags;
    }
});

module.exports = app;
