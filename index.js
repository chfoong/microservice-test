const express = require('express'),
  bodyParser = require('body-parser'),
  passport = require('passport'),
  uuidv1 = require('uuid/v1');

const low = require('lowdb'),
  FileSync = require('lowdb/adapters/FileSync'),
  adapter = new FileSync(__dirname + '/database/db.json'),
  db = low(adapter);

db.defaults({ orders: []})
  .write()

const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "payload-influx"});

const OrderService = require('./services/OrderService')
const PaymentService = require('./services/PaymentService')

// Assumed HTTPS termination has done on proxy server or load balancer.
// Below App(s) merely processing it plain HTTP

// OrdersApp => App1
const port1 = 3000;
const app1 = express();
app1.use(bodyParser.json({ type: 'application/json'}));
app1.use(function(req, res, next) {
  id = uuidv1()
  req.header('X-Reference-Id', id);
  res.header('X-Reference-Id', id);
  log.info({
    id: id,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  })
  next();
});
app1.use('/orders', OrderService)
app1.listen(port1, () => console.log(`OrdersApp listening on port ${port1}!`))

// PaymentsApp => App2
const port2 = 4000;
const app2 = express();
app2.use(bodyParser.json());
app2.use(function(req, res, next) {
  id = uuidv1()
  req.header('X-Reference-Id', id);
  res.header('X-Reference-Id', id);
  log.info({
    id: id,
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body
  })
  next();
});
app2.use('/payments', PaymentService)
app2.listen(port2, () => console.log(`PaymentsApp listening on port ${port2}!`))


module.exports.app1 = app1;
module.exports.app2 = app2;
