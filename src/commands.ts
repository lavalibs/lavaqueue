interface RedisCommand {
  name: string;
  keys: number;
}

const commands: RedisCommand[] = [
  {
    name: 'lmove',
    keys: 1,
  },
  {
    name: 'loverride',
    keys: 1,
  },
  {
    name: 'lrevsplice',
    keys: 1,
  },
  {
    name: 'lshuffle',
    keys: 1,
  },
  {
    name: 'multirpoplpush',
    keys: 2,
  },
];

export default commands;
