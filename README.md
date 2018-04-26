# Lavaqueue

A simple queue system for Lavalink, backed by Redis. Built as extension of [my generic Lavalink wrapper](https://github.com/appellation/lavalink.js).

## How to use

```js
const { Client: Lavaqueue } = require('lavaqueue');
const voice = new class extends Lavaqueue {
  constructor() {
    super({
      userID: '', // the user that will be sending audio
      password: '', // your lavalink password
      hosts: {
        rest: '', // your lavalink rest endpoint (include port and protocol)
        ws: '', // your lavalink ws endpoint (include port and protocol)
        redis: '', // your redis instance
      },
    });
  }

  send(guildID, packet) {
    // send the packet to the appropriate gateway connection
  }
};

voice.connect(); // connect to the Lavalink WS

async function connect() {
  const songs = await voice.rest.load('some identifier');
  const queue = voice.queues.get('some guild ID');

  await queue.player.join('channel id'); // join the voice channel
  await queue.add(...songs.map(s => s.track)); // add songs to the queue
  await queue.start(); // start the queue
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
- `player` - the [lavalink](https://github.com/appellation/lavalink.js) player

### `QueueStore`
- `connect(url/connection)` - connect to Redis or use an existing *promisified* Redis connection (recommended: `redis-p`)
- `start()` - start all currently playing queues
