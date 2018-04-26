import Queue from './Queue';
import Client from 'lavalink';
import * as Redis from 'ioredis';

export default class QueueStore extends Map<string, Queue> {
  public readonly client: Client;
  public redis?: Redis.Redis;

  constructor(client: Client) {
    super();
    this.client = client;
  }

  public connect(conn?: Redis.RedisOptions | Redis.Redis): Redis.Redis {
    if (this.redis) return this.redis;

    if (conn instanceof Redis) this.redis = conn;
    else this.redis = new Redis(conn);
    return this.redis;
  }

  public get(key: string): Queue {
    let queue = super.get(key);
    if (!queue) {
      queue = new Queue(this, key);
      this.set(key, queue);
    }

    return queue;
  }

  public async start() {
    const keys = await this._scan('playlists.*.np');
    const guilds = keys.map(key => {
      const match = key.match(/playlists\.(\d+)\.np/);
      if (match) return match[1];
      throw new Error('error extracting guild ID from playlist');
    });

    for (const guild of guilds) this.get(guild).start();
  }

  protected async _scan(pattern: string, cursor: number = 0, keys: string[] = []): Promise<string[]> {
    if (!this.redis) throw new Error('attempted to scan without a Redis connection');

    const response = await this.redis.scan(cursor, pattern);
    keys.push(...response[1]);

    if (response[0] === '0') return keys;
    return this._scan(pattern, response[0], keys);
  }
}
