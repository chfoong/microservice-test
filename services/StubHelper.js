const _ = require('lodash'),
  books = require('../stubs/books.json').books,
  customers = require('../stubs/customers.json').customers,
  merchants = require('../stubs/merchants.json').merchants;

var getBook = (uuid) => {
  return _.find(books, ['id', uuid]);
}

var getCustomer = (token) => {
  return _.find(customers, ['permanent_stub_bearer', token]);
}

var getCustomerCC = (id) => {
  return _.pick(_.find(customers, ['id', id]), ['cc_number', 'cc_name', 'cc_expiry', 'cc_cvc']);
}

var getMerchant = (basic_token) => {
  return _.find(merchants, ['merchant_basic_auth', basic_token]);
}

exports.getBook = getBook;
exports.getCustomer = getCustomer;
exports.getCustomerCC = getCustomerCC;
exports.getMerchant = getMerchant;
