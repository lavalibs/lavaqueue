import axios, { AxiosInstance } from 'axios';
import Client from 'lavalink';

export interface Track {
  track: string;
  info: {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    position: number;
    title: string;
    uri: string;
  };
}

export default class Rest {
  public readonly client: Client;
  private _inst?: AxiosInstance;

  constructor(client: Client) {
    this.client = client;
  }

  public configure(url: string): AxiosInstance {
    return this._inst = axios.create({
      baseURL: url,
      headers: { common: { Authorization: this.client.password } },
    });
  }

  public async load(identifier: string): Promise<Track[]> {
    if (!this._inst) throw new Error('no rest configuration available');

    const { data } = await this._inst.get<Track[]>('/loadtracks', {
      params: { identifier },
    });
    return data;
  }

  public decode(track: string): Promise<string>;
  public decode(tracks: string[]): Promise<string[]>;
  public async decode(tracks: string | string[]): Promise<string | string[]> {
    if (!this._inst) throw new Error('no rest configuration available');

    const { data } = Array.isArray(tracks) ?
      await this._inst.post<string[]>('/decodetracks', tracks) :
      await this._inst.get<string>('/decodetrack', { params: { track: tracks } });

    return data;
  }
}
