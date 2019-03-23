const _ = require('lodash'),
  passport = require('passport'),
  helper = require('../services/StubHelper');
const BearerStrategy = require('passport-http-bearer').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;

passport.use(new BearerStrategy(
  (token, callback) => {
    customer = helper.getCustomer(token);

    if(_.isEmpty(customer)) {
      callback(null, false);
    } else {
      callback(null, _.pick(customer, ['id', 'name']), { scope: 'all' });
    }
  }
));

passport.use(new BasicStrategy(
  (username, password, callback) => {
    basic_token = Buffer.from(username + ':' + password).toString('base64');
    merchant = helper.getMerchant(basic_token);

    if(_.isEmpty(merchant)) {
      callback(null, false);
    } else {
      callback(null, merchant, { scope: 'all' });
    }
  }
));
