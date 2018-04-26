import BaseClient from 'lavalink';
import { Redis, RedisOptions } from 'ioredis';
import QueueStore from './QueueStore';
import Queue from './Queue';
import { ClientOptions } from 'lavalink/typings/core/Client';

export interface Options extends ClientOptions {
  hosts?: {
    ws?: string;
    rest?: string;
    redis?: Redis | RedisOptions;
  }
}

abstract class Client extends BaseClient {
  public readonly queues: QueueStore = new QueueStore(this);

  constructor(opts: Options) {
    super(opts);
    if (opts.hosts && opts.hosts.redis) this.queues.connect(opts.hosts.redis);

    this.on('event', (d) => {
      this.queues.get(d.guildId).emit('event', d);
    });

    this.on('playerUpdate', (d) => {
      this.queues.get(d.guildId).emit('playerUpdate', d);
    });
  }
}

export {
  Client,
  QueueStore,
  Queue,
}

export default Client;
