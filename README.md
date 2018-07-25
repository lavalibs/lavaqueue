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

async function connect() {
  const res = await voice.load('some identifier');
  const queue = voice.queues.get('some guild ID');

  await queue.player.join('channel id'); // join the voice channel
  await queue.add(...res.tracks.map(t => t.track)); // add songs to the queue
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
- `store: QueueStore`
- `guildID: string`
- *readonly* `player` - the [lavalink](https://github.com/appellation/lavalink.js) player
- `start()` - start the queue
- `add(...tracks: string[])` - add tracks to the queue
- `remove(track: string)` - remove a track from the queue
- `next()` - skip to the next song
- `stop()` - stop playback and clear the queue
- `clear()` - clear the queued songs
- `current()` - retrieve the current song: returns an object with properties `track` and `position`
- `tracks(): Promise<string[]>` - retrieves queued tracks

### `QueueStore extends Map<string, Queue>`
- `client: Client`
- `redis: Redis` - the ioredis instance this queue store is using
- `start()` - start all currently playing queues
- `get(key: string): Queue` - gets the specified queue, or creates one if none is found
