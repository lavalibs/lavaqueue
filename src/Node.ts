import Node, { ConnectionOptions, NodeOptions } from 'lavalink';
import Redis = require('ioredis');
import Queue from './Queue';
import QueueStore from './QueueStore';

export interface Options extends NodeOptions {
  hosts?: {
    ws?: string | { url: string, options: ConnectionOptions };
    rest?: string;
    redis?: Redis.Redis | Redis.RedisOptions;
  },
  advanceBy?: (queue: Queue, info: { previous: string, remaining: number }) => number;
}

export default class LavaqueueNode extends Node {
  public readonly queues: QueueStore;
  public advanceBy: (queue: Queue, info: { previous: string, remaining: number }) => number;

  constructor(opts: Options) {
    if (!opts.hosts || !opts.hosts.redis) throw new Error('cannot make a queue without a Redis connection');

    super(opts);
    this.queues = new QueueStore(this, opts.hosts.redis instanceof Redis ? opts.hosts.redis : new Redis(opts.hosts.redis));
    this.advanceBy = opts.advanceBy || (() => 1);

    for (const name of ['event', 'playerUpdate']) {
      this.on(name, (d) => {
        this.queues.get(d.guildId).emit(name, d);
      });
    }
  }
}
