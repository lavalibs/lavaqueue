# Lavaqueue

[![lavalibs support server](https://discordapp.com/api/guilds/494948120103485440/embed.png)](https://discord.gg/jXSKeW5)

A simple queue system for Lavalink, backed by Redis. Built as extension of [my generic Lavalink wrapper](https://github.com/appellation/lavalink.js).

## How to use

```js
const { Client: Lavaqueue } = require('lavaqueue');
const voice = new Lavaqueue({
  userID: '', // the user that will be sending audio
  password: '', // your lavalink password
  hosts: {
    rest: '', // your lavalink rest endpoint (include port and protocol)
    ws: '', // your lavalink ws endpoint (include port and protocol)
    redis: '', // your redis instance
  },
  send(guildID, packet) {
    // send the packet to the appropriate gateway connection
  },
  advanceBy(queue, { previous, remaining }) { // optional
    // called at the end of a track when the queue is otherwise unaware of how many tracks to
    // advance by; returns a number: 0 to repeat, negative to advance in reverse, positive to
    // advance forward
  },
});

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
- *readonly* `player` - the [lavalink](https://github.com/lavalibs/lavalink.js) player
- `start(): Promise<boolean>` - start the queue
- `add(...tracks: string[]): Promise<number>` - add tracks to the queue
- `unshift(...tracks: string[]): Promise<number>` - add tracks to the front of the queue
- `remove(track: string): PromiseLike<number>` - remove a track from the queue
- `next(count: number = 1): Promise<boolean>` - skip to the next song; pass negatives to advance in reverse, or 0 to repeat
- `sort(predicate?: (a: string, b: string) => number): Promise<number>` - sort the upcoming tracks; resolves with the length of the queue
- `move(from: number, to: number): Promise<string[]>` - move a track by index; resolves with the new list
- `shuffle(): Promise<string[]>` - shuffle the list; resolves with the new list
- `splice(start: number, deleteCount?: number, ...tracks: string[]): Promise<string[]>` - splice the list at the given position; works like [Array#splice](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice)
- `trim(start: number, end: number): PromiseLike<string>` - trim the queue to between the specified positions
- `stop(): Promise<void>` - stop playback
- `clear(): PromiseLike<number>` - clear the queue
- `current(): Promise<NP | null>` - retrieve the current song: returns an object with properties `track` and `position`
- `tracks(start: number = 0, end: number = -1): Promise<string[]>` - retrieves queued tracks

```ts
interface NP {
  position: number;
  track: string;
}
```

### `QueueStore extends Map<string, Queue>`
- `client: Client`
- `redis: Redis` - the ioredis instance this queue store is using
- `start(filter?: (guildID: string) => boolean)` - start all currently playing queues, with an optional filter callback
- `get(key: string): Queue` - gets the specified queue, or creates one if none is found
