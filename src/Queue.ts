import { Player } from 'lavalink';
import { Redis } from 'ioredis';
import QueueStore from './QueueStore';
import { EventEmitter } from 'events';

export interface NP {
  position?: number;
  track: string;
}

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
      // if the track wasn't replaced, continue playing the next song
      if (d.reason !== 'REPLACED') {
        try {
          await this.next();
        } catch (e) {
          this.store.client.emit('error', e);
        }
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

  public remove(track: string): PromiseLike<number> {
    return this._redis.lrem(this.keys.list, 1, track);
  }

  public async next() {
    await this._redis.del(this.keys.np);
    return this.start();
  }

  public async stop() {
    await this.clear();
    await this.player.stop();
  }

  public clear() {
    return this._redis.del(this.keys.list);
  }

  public async current(): Promise<NP | null> {
    const cur = await this._redis.hgetall(this.keys.np) as NP;
    return Object.keys(cur).length ? cur : null;
  }

  public tracks(): PromiseLike<string[]> {
    return this._redis.lrange(this.keys.list, 0, -1);
  }

  protected get _redis(): Redis {
    return this.store.redis;
  }
}
