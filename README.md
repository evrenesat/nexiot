# nexiot   
##### Easy to use AMQP based Pub & Sub and RPC library for Node.js

### Installation

```sh
$ npm install --save nexiot
```

### Configuration

Settings can be supplied by environmental variables:

```sh
$ export API_URL=amqp://guest:guest@localhost/
$ export EXCHANGE=amq.topic
$ export ROUTING_KEY=#
$ export RPC_PREFIX='miimetiq.writer.rpc.'
```

or at the initialization stage:

```js
var nexiot = require('nexiot');
var settings = {
        apiURL: 'amqp://guest:guest@localhost/',
        exchange: 'amq.topic',
        routingKey: '#',
        rpcPrefix: 'miimetiq.writer.rpc.'
}
var client = nexiot.Nexiot(settings);
```

Note: These are the default settings.

### Usage
#### Publish & Subscribe:
```js
var nexiot = require('nexiot');
var client = nexiot.Nexiot();
client.connect().then(function(){
	client.subscribe({routingKey: 'my.routing.key',
	                  callback: function (msg) {
	                  	console.log(JSON.parse(msg.content.toString()));
	                  },
	                }).then(function(){
							client.publish({any:'json', serializable: 'object'}, 'my.routing.key');
							});
});           
```

#### RPC:

```js
var nexiot = require('nexiot');


function fakeRPCServer(cb, device_id) {
    device_id = device_id || '*';
    server = nexiot.Nexiot();
    server.connect().then(function () {
        server.subscribe({
            routingKey: server.settings.rpcPrefix + device_id,
            callback: function (msg) {
                var taskID = msg.properties.correlationId;
                server.publish({'result': 'Success', 'taskID': taskID}, taskID);
            }
        }).then(cb());
    });
}

fakeRPCServer(function(){
   var client = nexiot.Nexiot();
   client.connect().then(function(){
		Nexiot.rpc('target_id', 
					 'foo_command', 
					 function(msg){console.log(JSON.parse(msg.content.toString()));},
				  	 {payload: 'object'}, 
				  	 'optionalTaskID');
	})
});              
```

