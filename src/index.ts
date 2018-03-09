import BaseClient from 'lavalink';
import QueueStore from './QueueStore';
import Queue from './Queue';
import Rest from './Rest';
import { ClientOptions } from 'lavalink/typings/core/Client';

class Client extends BaseClient {
  public readonly queues: QueueStore = new QueueStore(this);
  public readonly rest: Rest = new Rest(this);

  constructor(opts: ClientOptions) {
    super(opts);

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
  Rest,
}

export default Client;
