/**
 * Created by evren on 06/09/16.
 */
'use strict';

var amqplib = require('amqplib');
var when = require('when');
var extend = require('extend');

function opt(options, name, dflt) {
    return options && options[name] !== undefined ? options[name] : dflt;
}

var Settings = {
    API_URL: opt(process.env, 'API_URL', 'amqp://guest:guest@localhost/'),
    exchange: opt(process.env, 'EXCHANGE', 'amq.topic'),
    routingKey: opt(process.env, 'ROUTING_KEY', '#'),
    rpcPrefix: opt(process.env, 'RPC_PREFIX', 'miimetiq.writer.rpc.')
};

var Nexiot = function (parameters) {

    var settings = extend({}, Settings, parameters);

    function connect() {
        var self = this;
        // console.log("URL", self.settings.API_URL);
        return amqplib.connect(self.settings.API_URL).then(function (conn) {
            self.connection = conn;
            return conn.createChannel();
        }).then(function (ch) {
            self.channel = ch;
            return ch;
        });

    }

    function disconnect() {
        var self = this;
        return self.connection.close();
    }

    /**
     * Publishes given content with given routingKey
     *
     * @param {*} content - the payload
     * @param {string} routingKey - endpoint identifier
     * @param {string} [exchange] - exchange identifier
     * @param {Object} [options] - extra publish options
     */
    function publish(content, routingKey, exchange, options) {
        var self = this;
        exchange = exchange || self.settings.exchange;
        var message = new Buffer(JSON.stringify(content));
        // console.log("Publishing \ncontent:", content, "\nroutingKey: ", routingKey,
        //     "\nexchange: ", exchange, "\noptions: ", options)
        self.channel.publish(exchange, routingKey, message, options);
    }

    /**
     * Starts consuming on given exchange with given callback method
     * if no callback given, default logging callback will be used.
     *
     * @param {function} parameters.callback - consumer callback method
     *                   which will be called with AMQP result message object.
     *                   message body can be accessed from 'content' property:
     *                     function(msg){msg.content.toString()}
     *                   @see {@link http://goo.gl/j9D77i} for more details.
     * @param {string} parameters.routingKey - endpoint identifier
     * @param {string} parameters.queueName - optional queue name.
     * @param {string} parameters.exchange - optional exchange identifier
     * @returns {Promise} - A Promise for successful subscription.
     */
    function subscribe(parameters) {
        var self = this;
        var subscribed = when.defer();
        var callback = opt(parameters, 'callback',
            function (msg) {
                console.log(msg.content.toString())
            }
        );
        var options = extend({}, self.settings, parameters);
        when.all([
            self.channel.assertQueue(options.queueName, {autoDelete: true}),
            self.channel.assertExchange(options.exchange, 'topic'),
            self.channel.bindQueue(options.queueName, options.exchange, options.routingKey)
        ]).then(function (rply) {
            // console.log("Subscribe pre-consume \nbindqueue: ", rply[0].queue,
            //     "\nroutingKey: ", options.routingKey,
            //     "\nCallback: \n", callback);
            self.channel.consume(options.queueName, callback, {noAck: true});
            subscribed.resolve();
        });
        return subscribed.promise;

    }

    /**
     * Makes a RPC call with given routingKey.
     *
     * @param {string} target - routingKey of RPC server
     * @param {string} command - RPC command
     * @param {function} callback - method to be called with result.
     *                   callback argument of publish method
     *                   @see {@link publish}
     * @param {*} payload - optional payload of the command
     * @param {string} [taskID] task ID.
     */
    function rpc(target, command, callback, payload, taskID) {
        var self = this;
        var taskID = taskID || Math.random().toString().substring(2);
        var content = {'command': command, 'payload': payload};
        var rpcPattern = self.settings.rpcPrefix + target;
        self.subscribe({routingKey: taskID, callback: callback}).then(function () {
            // console.log("RPC subscribed for taskID", taskID);
            self.publish(content, rpcPattern, null, {correlationId: taskID});
            // console.log("RPC published to ", rpcPattern);
        });
    }

    function get_system_report(device_id) {
        var self = this;
        self.rpc(device_id, 'get_report', function(msg){
            console.log(msg.content.toString())
        })
    }

    var channel = null;
    return {
        channel: channel,
        settings: settings,
        connect: connect,
        disconnect: disconnect,
        publish: publish,
        subscribe: subscribe,
        rpc: rpc,
        get_system_report: get_system_report,

    };

};

module.exports.Settings = Settings;
module.exports.Nexiot = Nexiot;