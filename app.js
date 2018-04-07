const bodyParser = require('body-parser');

const app = require('express')()
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: true })),
  config = require('./config/constants.json'),
  storeList = [],
  server = require('http').createServer(app),
  io = require('socket.io')(server),
  firebase = require('firebase'),
  firebaseMiddleware = require('express-firebase-middleware');
require('firebase/auth');
firebase.initializeApp(config.FIREBASE.BASE_CONFIG);
const admin = require('firebase-admin'),
  serviceAccount = require(config.FIREBASE.SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.DB.DUMMY_DB
});

const db = admin.database(),
  ref = db.ref(config.DB.DUMMY_COLLECTION);

const port = process.env.PORT || config.SERVER.PORT
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
  storeList.push(store);
  return res.json(req.query.q);
});

app.get('/api/food', (req, res, next) => {
  ref.once('value', snapshot => {
    return res.send(snapshot.val());
  });
});

server.listen(port, () => {
  console.log(
    `The server is running at http://localhost:${port}`
  );
});

io.sockets.on('connection', function(client) {
  console.log('Successfully connected to the server via socket transport :)');
  client.on('disconnect', function() {
    console.log('Disconnecting socket from the server');
  });
});
