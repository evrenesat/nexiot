# nexiot 
Easy to use AMQP based Pub & Sub and RPC library. 

## Installation

```sh
$ npm install --save nexiot
```

## Configuration

Can be done via environmental variables
```sh
$ 
```
or at initialization of client.
```js
var nexiot = require('nexiot');
var settings = {
        API_URL: 'amqp://guest:guest@localhost/',
        exchange: 'amq.topic',
        routingKey: '#',
        rpcPrefix: 'miimetiq.writer.rpc.'
}
var client = nexiot.Nexiot(settings);
```


## Usage

```js
var nexiot = require('nexiot');
var client = nexiot.Nexiot();
client.connect()
```

