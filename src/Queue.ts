import { Player } from 'lavalink';
import QueueStore, { ExtendedRedis } from './QueueStore';
import { EventEmitter } from 'events';

export interface NP {
  position: number;
  track: string;
}

export default class Queue extends EventEmitter {
  public readonly keys: { next: string, pos: string, prev: string };

  constructor(public readonly store: QueueStore, public readonly guildID: string) {
    super();
    this.keys = {
      next: `playlists.${this.guildID}.next`,
      pos: `playlists.${this.guildID}.pos`,
      prev: `playlists.${this.guildID}.prev`, // left-most (first) element is the currently playing track
    };

    this.on('event', async (d) => {
      // if the track wasn't replaced or manually stopped, continue playing the next song
      if (!['REPLACED', 'STOPPED'].includes(d.reason)) {
        try {
          await this._next();
        } catch (e) {
          this.store.client.emit('error', e);
        }
      }
    });

    this.on('playerUpdate', async (d) => {
      try {
        await this._redis.set(this.keys.pos, d.state.position);
      } catch (e) {
        this.store.client.emit('error', e);
      }
    });
  }

  public get player(): Player {
    return this.store.client.players.get(this.guildID);
  }

  public async start(): Promise<boolean> {
    const np = await this.current();
    if (!np) {
      const list = await this._next({ previous: np });
      return Boolean(list.length);
    }

    if (np.track) {
      await this.player.play(np.track, { start: np.position });
      return true;
    }

    return false;
  }

  public add(...tracks: string[]): Promise<number> {
    if (!tracks.length) return Promise.resolve(0);
    return this._redis.lpush(this.keys.next, ...tracks);
  }

  public unshift(...tracks: string[]): Promise<number> {
    if (!tracks.length) return Promise.resolve(0);
    return this._redis.rpush(this.keys.next, ...tracks);
  }

  public remove(track: string): PromiseLike<number> {
    return this._redis.lrem(this.keys.next, 1, track);
  }

  public async next(count: number = 1): Promise<boolean> {
    const list = await this._next({ count });
    return Boolean(list.length);
  }

  public shuffle(): Promise<string[]> {
    return this._redis.lshuffle(this.keys.next);
  }

  public trim(start: number, end: number): PromiseLike<string> {
    return this._redis.ltrim(this.keys.next, start, end);
  }

  public async stop() {
    await this.player.stop();
  }

  public async clear(): Promise<number> {
    return this._redis.del(this.keys.next, this.keys.prev, this.keys.pos);
  }

  public async current(): Promise<NP | null> {
    const [track, position] = await Promise.all([
      this._redis.lindex(this.keys.prev, 0),
      this._redis.get(this.keys.pos),
    ]);

    if (track) {
      return {
        track,
        position: parseInt(position) || 0,
      };
    }

    return null;
  }

  public tracks(start: number = 0, end: number = -1): PromiseLike<string[]> {
    if (end === Infinity) end = -1;
    return this._redis.lrange(this.keys.next, start, end);
  }

  protected async _next({ count, previous }: { count?: number, previous?: NP | null } = {}): Promise<string[]> {
    if (!previous) previous = await this.current();
    if (!count && previous) count = this.store.client.advanceBy(this, previous.track);
    if (count === 0) return [];

    const next = await this._redis.multirpoplpush(this.keys.next, this.keys.prev, count || 1);
    if (next.length) {
      await this._redis.set(this.keys.pos, 0);
      await this.start();
    }

    return next;
  }

  protected get _redis(): ExtendedRedis {
    return this.store.redis;
  }
}
