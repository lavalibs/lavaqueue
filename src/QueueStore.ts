import Queue from './Queue';
import Client from 'lavalink';
import * as Redis from 'ioredis';

export default class QueueStore extends Map<string, Queue> {
  constructor(public readonly client: Client, public redis: Redis.Redis) {
    super();
  }

  public get(key: string): Queue {
    let queue = super.get(key);
    if (!queue) {
      queue = new Queue(this, key);
      this.set(key, queue);
    }

    return queue;
  }

  public async start(filter?: (guildID: string) => boolean) {
    const keys = await this._scan('playlists.*');
    const guilds = keys.map(key => {
      const match = key.match(/^playlists\.(\d+)/);
      if (match) return match[1];
      throw new Error('error extracting guild ID from playlist');
    });

    await Promise.all(guilds.map(guild => {
      if (!filter || filter(guild)) return this.get(guild).start();
      return false;
    }));
  }

  protected async _scan(pattern: string, cursor: number = 0, keys: string[] = []): Promise<string[]> {
    const response = await this.redis.scan(cursor, 'MATCH', pattern);
    keys.push(...response[1]);

    if (response[0] === '0') return keys;
    return this._scan(pattern, response[0], keys);
  }
}
