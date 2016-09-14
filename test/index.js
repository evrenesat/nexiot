/**
 * Created by evren on 08/09/16.
 */
var should = require('should');
var nexiot = require('..');
function runRPCServer(done, device_id) {
    server = nexiot.Nexiot();
    server.connect().then(function () {
        server.subscribe({
            routingKey: server.settings.rpcPrefix + device_id,
            callback: function (msg) {
                var taskID = msg.properties.correlationId;
                server.publish({'result': 'Success', 'taskID': taskID}, taskID);
            }
        }).then(done);
    });
}


describe('Nexiot Library', function () {
    it('should have a Nexiot client', function () {
        nexiot.should.have.property('Nexiot');
    });
    it('should have a Settings object', function () {
        nexiot.should.have.property('Settings');
    });

    describe('Public Methods', function () {
        var Nexiot = nexiot.Nexiot();

        it('should have a connect method', function () {
            Nexiot.should.have.property('connect');
        });
        it('should have a disconnect method', function () {
            Nexiot.should.have.property('disconnect');
        });
        it('should have a publish method', function () {
            Nexiot.should.have.property('publish');
        });
        it('should have a subscribe method', function () {
            Nexiot.should.have.property('subscribe');
        });
        it('should have a rpc method', function () {
            Nexiot.should.have.property('rpc');
        });
        it('should have a get_system_report method', function () {
            Nexiot.should.have.property('get_system_report');
        });
    });

    describe('Publish & Subscribe Support', function () {
        var Nexiot = nexiot.Nexiot();
        it('subscribe then publish to same routingKey', function (done) {
            var routingKey = 'rkey';
            Nexiot.connect().then(function () {
                Nexiot.subscribe({
                    callback: function (msg) {
                        var reply = JSON.parse(msg.content.toString());
                        reply.should.have.a.value('ok', true);
                        done();
                    },
                    routingKey: routingKey
                }).then(function () {
                    Nexiot.publish({ok: true}, routingKey);

                });
            });
        });

    });

    describe('RPC Support', function () {
        var Nexiot = nexiot.Nexiot();
        var deviceID = 'R2';
        var taskID = 'T1';
        before(function (done) {
            Nexiot.connect().then(function () {
                runRPCServer(done, deviceID);
            });

        });
        it('should get a reply for rpc call', function (done) {
            Nexiot.rpc(deviceID, 'foo', function (msg) {
                var reply = JSON.parse(msg.content.toString());
                reply.should.have.a.value('taskID', taskID);
                reply.should.have.a.value('result', 'Success');
                done();
            }, null, taskID);
        });

    });


});
