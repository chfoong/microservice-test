let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

describe('Simple POST and GET scenario', function(){
  let oauth = 'Bearer 0b79bab50daca910b000d4f1a2b675d604257e42'
  let orderid = ''

  it('post order', function(done){
    chai.request(server.app1)
      .post('/orders')
      .set('Authorization', oauth)
      .type('json')
      .send({
      	"items": [{
      		"id": "180dc290-4cb4-11e9-b639-e5b00b160b18"
      	}]
      })
      .end((err, res) => {
        res.body.meta.code.should.be.eql(200)
        orderid = res.body.response.order.orderid
        done();
      });
  });

  it('get order with id', function(done){
    setTimeout(() => {
      chai.request(server.app1)
        .get('/orders' + '/' + orderid)
        .set('Authorization', oauth)
        .end((err, res) => {
          console.log(err)
          res.body.meta.code.should.be.eql(200)
          res.body.response.order.orderid.should.be.eql(orderid)
          done();
        });
    }, 1000);
  });
});
