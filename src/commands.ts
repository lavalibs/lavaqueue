interface RedisCommand {
  name: string;
  keys: number;
}

const commands: RedisCommand[] = [
  {
    name: 'loverride',
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
