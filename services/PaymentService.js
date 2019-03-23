const _ = require('lodash'),
  express = require('express'),
  passport = require('passport'),
  router = express.Router();

const { check, validationResult } = require('express-validator/check');

const Order = require('../models/Order'),
  helper = require('./StubHelper')
  response = require('../config/response');

require('../config/passport');

router.post('/',
  passport.authenticate('basic', { session: false }),
  [
    check('cc_number').isCreditCard(),
    check('cc_name').not().isEmpty().trim(),
    check('cc_expiry').not().isEmpty().trim(),
    check('cc_cvc').isLength({ min: 3, max:4 }).isNumeric(),
    check('order').not().isEmpty()
  ],
  (req, res) => {

  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  // In ideal world there shall be fail-over, DB trail, audit trail, and
  // orchestration to other payment/ finance reconciliation parties.
  // Not implementing it here.

  // 70% approve rate, 30% reject rate

  let itemSum = _.reduce(req.body.order.items, (total, item) => {
    return total + item.price
  }, 0)

  if(itemSum === req.body.order.total) {
    if (Math.random() >= 0.3 ) {
      res.json(response.createJsonResponse(null));
    } else {
      res.json(response.createJsonResponse('Transaction Fail'));
    }
  } else {
    res.json(response.createJsonResponse('Amount not tally'));
  }
})


module.exports = router;
