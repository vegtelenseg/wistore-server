const bodyParser = require('body-parser');
const app = require('express')()
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }));

const config = require('./config/constants.json');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const firebase = require('firebase');
const firebaseMiddleware = require('express-firebase-middleware');
require('firebase/auth');
const admin = require('firebase-admin');
const serviceAccount = require(config.FIREBASE.SERVICE_ACCOUNT);

firebase.initializeApp(config.FIREBASE.BASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.DB.DUMMY_DB
});

const db = admin.database(),
  ref = db.ref(config.DB.DUMMY_COLLECTION);

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS, PUT, PATCH, DELETE'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-Requested-With,content-type'
  );
  // Set this to true when using sessions
  res.setHeader('Access-Control-Allow-Credentials', false);
  next();
});
const port = process.env.PORT || config.SERVER.PORT;
/**
 * Triggers a 'child_changed' event whenever a database document is altered.
 * Returns, to callback, a snapshot of the up-to-date document
 * @param snapshot : contains the modified document from the database
 **/
ref.on('child_changed', function(snapshot) {
  const changedItem = snapshot.val();
  io.emit('product changed', changedItem);
});

app.set('port', port);

/*if (process.env.NODE_ENV === config.ENV.PROD) {
  app.use(express.static('src/build'));
}*/

app.use('/api/find-store', (req, res) => {
  const store = req.query.q.toLowerCase();
  return res.json(req.query.q);
});

app.get('/api/food', (req, res, next) => {
  ref.once('value', snapshot => {
    return res.send(snapshot.val());
  });
});

server.listen(port, () => {
  if (port >= 4300 && port < 4305) {
    return console.log(`The server is running at http://localhost:${port}`);
  }
  return console.log(
    `The server is running at https://wistore-server.herokuapp.com:${
      process.env.PORT
    }`
  );
});

io.sockets.on('connection', function(client) {
  console.log('Successfully connected to the server via socket transport :)');
  client.on('disconnect', function() {
    console.log('Disconnecting socket from the server');
  });
});
