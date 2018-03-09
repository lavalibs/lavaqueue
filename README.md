# Lavaqueue

A simple queue system for Lavalink, backed by Redis.

## How to use

```js
const { Client: Lavaqueue } = require('lavaqueue');
const voice = new Client({
  userID: '', // the user that will be sending audio
  shards: '', // how many shards the bot has
  password: '', // your lavalink password
});

voice.queues.connect({ host: 'yourredis' }); // connect the queues to redis
voice.rest.configure('lavalink:port'); // setup the Lavalink REST url and port
voice.connect('lavalink:port'); // connect to the Lavalink WS

// make sure to forward VOICE_STATE_UPDATE and VOICE_SERVER_UPDATE packets to Lavalink

async function connect() {
  const songs = await voice.rest.load('some identifier');
  const queue = voice.queues.get('some guild ID');
  await queue.add(...songs.map(s => s.track));
  // join the voice channel somehow
  await queue.start();
}

async function skip() {
  await voice.queues.get('some guild ID').next();
}

async function stop() {
  await voice.queues.get('some guild ID').stop();
}
```

Queues are resilient to crashes, meaning it's safe to blindly restart a queue: it will attempt to recover the previous song at the point the crash occurred. You can restart all currently playing queues by calling `voice.queues.start()`, although it is recommended to do so as infrequently as possible.

## Reference

### `Queue`
- `start()` - start the queue
- `add(...tracks)` - add tracks to the queue
- `remove(track)` - remove a track from the queue
- `next()` - skip to the next song
- `stop()` - stop playback and clear the queue
- `current()` - retrieve the current song: returns an object with properties `track` and `position`

### `Rest`
- `configure(url)` - setup the Lavalink URL to load from
- `load(identifier)` - load a Lavalink identifier
- `decode(identifier/s)` - decode a single identifier (accepts `string`) or multiple (accepts `Array<string>`)

### `QueueStore`
- `connect(url/connection)` - connect to Redis or use an existing *promisified* Redis connection (recommended: `redis-p`)
- `start()` - start all currently playing queues
