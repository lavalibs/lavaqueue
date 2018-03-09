import Client, { Player } from 'lavalink';
import { RedisClient } from 'redis-p';
import QueueStore from './QueueStore';
import { EventEmitter } from 'events';

export default class Queue extends EventEmitter {
  public readonly store: QueueStore;
  public readonly guildID: string;
  public readonly keys: { list: string, np: string };

  constructor(store: QueueStore, guildID: string) {
    super();
    this.store = store;
    this.guildID = guildID;
    this.keys = {
      list: `playlists.${this.guildID}`,
      np: `playlists.${this.guildID}.np`,
    };

    this.on('event', async (d) => {
      console.log(d);
      try {
        // if the track wasn't replaced, continue playing the next song
        if (d.type !== 'TrackEndEvent' || d.reason !== 'REPLACED') {
          await this._redis.del(this.keys.np);
          await this.start();
        }
      } catch (e) {
        this.store.client.emit('error', e);
      }
    });

    this.on('playerUpdate', async (d) => {
      try {
        await this._redis.hset(this.keys.np, 'position', d.state.position);
      } catch (e) {
        this.store.client.emit('error', e);
      }
    });
  }

  public get player(): Player {
    return this.store.client.players.get(this.guildID);
  }

  public async start() {
    const np = await this.current();
    console.log(np);
    if (np) {
      await this.player.play(np.track, { start: Number(np.position) || 0 });
      return true;
    } else {
      const next = await this._redis.lpop(this.keys.list);
      if (!next) {
        await this._redis.del(this.keys.list, this.keys.np);
        return false;
      }

      await this.player.play(next);
      await this._redis.hset(this.keys.np, 'track', next);
      return true;
    }
  }

  public add(...tracks: string[]) {
    if (!tracks.length) return Promise.resolve(0);
    return this._redis.rpush(this.keys.list, ...tracks);
  }

  public remove(track: string) {
    return this._redis.lrem(this.keys.list, 1, track);
  }

  public next() {
    return this.player.stop();
  }

  public async stop() {
    await this.clear();
    await this.player.stop();
  }

  public clear() {
    return this._redis.del(this.keys.list);
  }

  public current() {
    return this._redis.hgetall(this.keys.np);
  }

  protected get _redis() {
    if (this.store.redis) return this.store.redis;
    throw new Error('no redis client available');
  }
}
