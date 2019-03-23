const _ = require('lodash')
const uuidv1 = require('uuid/v1');

function Order(customer, items, status) {
  this.orderid = uuidv1();
  this.customer = customer;
  this.items = items;
  this.status = status
  this.created = new Date();
  this.updated = new Date();
}

module.exports = Order;
