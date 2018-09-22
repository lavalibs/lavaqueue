import Queue from './Queue';
import Client from './';
import Redis = require('ioredis');
import path = require('path');
import fs = require('fs');

export interface ExtendedRedis extends Redis.Redis {
  multirpoplpush: (source: string, dest: string, count: number) => Promise<string[]>;
  lshuffle: (key: string) => Promise<string[]>;
}

export default class QueueStore extends Map<string, Queue> {
  public redis: ExtendedRedis;

  constructor(public readonly client: Client, redis: Redis.Redis) {
    super();

    this.redis = redis as any;
    this.redis.defineCommand('multirpoplpush', {
      numberOfKeys: 2,
      lua: fs.readFileSync(path.resolve(__dirname, 'scripts', 'multirpoplpush.lua')).toString(),
    });

    this.redis.defineCommand('lshuffle', {
      numberOfKeys: 1,
      lua: fs.readFileSync(path.resolve(__dirname, 'scripts', 'lshuffle.lua')).toString(),
    });
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
