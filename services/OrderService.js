const _ = require('lodash'),
  express = require('express'),
  passport = require('passport'),
  request = require('request'),
  rp = require('request-promise-native'),
  router = express.Router();

const Order = require('../models/Order'),
  helper = require('./StubHelper')
  response = require('../config/response');

const low = require('lowdb'),
  FileSync = require('lowdb/adapters/FileAsync'),
  adapter = new FileSync(__dirname + '/../database/db.json');

const bunyan = require('bunyan');
const log = bunyan.createLogger({name: "order-service"});

require('../config/passport');

const STATUS_ENUM = {
  'CREATED': 0,
  'CONFIRMED': 1,
  'DELIVERED': 2,
  'CANCELLED': 9,
}

router.post('/',
  passport.authenticate('bearer', { session: false }),
  (req, res) => {

  // Lookup book name & price, Compact Arrays to remove Null
  let items = _(req.body.items)
    .map( (item) => {
      return helper.getBook(item.id);
    })
    .compact()
    .value();

  // Create Order
  let order = new Order(req.user, items, STATUS_ENUM.CREATED)
  log.info("Order Created");

  // This is background job. promise block still exec even res.json() done
  // 1. Save to DB with Promise
  // 2. Orchestrate to PaymentApp, Get Payment Reference. Prommise Native http
  // 3. Update to DB

  // Nested Promise block. Personally used to caolan/async
  low(adapter)
    .then((db) => {
      db.get('orders').push(order).write()
        .then(() => {
          let payload = {
            order: order
          }
          payload.order.total = _.reduce(order.items, (total, item) => {
            return total + item.price
          }, 0)
          _.assign(payload, helper.getCustomerCC(req.user.id))

          // Hardcode URI and Auth. Normally put outside for env
          rp.post('http://localhost:4000/payments', {
            headers: {
              Authorization: 'Basic SGVsbG9Xb3JsZDpTZXRlbDIwMTk=',
              'Source-Reference-Id': req.headers['X-Reference-Id']
            },
            json: payload
          })
          .then((resBody) => {
            // Order Confirmed
            log.info("Order Confirmed");
            if(_.get(resBody, 'meta.code') === 200) {
              db.get('orders').find({ orderid: order.orderid }).assign({ status: STATUS_ENUM.CONFIRMED, updated: new Date()}).write()
                .then(() => {
                  // Order To be Delivered, wait 15 seconds
                  new Promise(res => setTimeout(() => {
                    log.info("Order Delivered");
                    db.get('orders').find({ orderid: order.orderid }).assign({ status: STATUS_ENUM.DELIVERED, updated: new Date()}).write()
                  }, 15000));
                })
            } else {
              // Order Cancelled
              db.get('orders').find({ orderid: order.orderid }).assign({ status: STATUS_ENUM.CANCELLED, updated: new Date()}).write()
                .then(() => {
                  log.info("Order Cancelled");
                })
            }
          })
          .catch((err) => {
            // Need error handling for handshake fail
            log.error("Payment App request payload reject");
          })
        })
    })

  // Styling output, remove id
  output = styleOrderOutput(order)

  // Response
  res.json(response.createJsonResponse(null, output))
})

// check status
router.get('/:orderid',
  passport.authenticate('bearer', { session: false }),
  (req, res) => {
    low(adapter)
      .then((db) => {
        result = db.get('orders')
          .find({ orderid: req.params.orderid, customer: {id: req.user.id} })
          .value()

        if(_.isEmpty(result)) {
          res.json(response.createJsonResponse('Order not found'))
        } else {
          output = styleOrderOutput(result)
          res.json(response.createJsonResponse(null, output))
        }
      })
  })

router.delete('/:orderid',
  passport.authenticate('bearer', { session: false }),
  (req, res) => {
    low(adapter)
      .then((db) => {
        result = db.get('orders')
          .find({ orderid: req.params.orderid, customer: {id: req.user.id} })
          .value()

        if(_.isEmpty(result)) {
          res.json(response.createJsonResponse('Order not found'))
        } else {
          if(result.status === STATUS_ENUM.CANCELLED) {
            res.json(response.createJsonResponse('Invalid Request. This order already cancelled.'))
          } else if (result.status === STATUS_ENUM.CONFIRMED || result.status === STATUS_ENUM.DELIVERED) {
            res.json(response.createJsonResponse('Invalid Request. This order has been proceed and ready to deliver.'))
          } else {
            db.get('orders').find({ orderid: req.params.orderid }).assign({ status: STATUS_ENUM.CANCELLED, updated: new Date()}).write()
              .then(() => {
                res.json(response.createJsonResponse(null))
              })
          }
        }
      })
  })

function styleOrderOutput(order) {
  output = _.omit(order, ['customer.id'])
  output.items = _.map(output.items, (item) => {
    return _.omit(item, ['id'])
  })
  output.total = _.reduce(output.items, (total, item) => {
    return total + item.price
  }, 0)
  return {
    order: output
  };
}

module.exports = router;
