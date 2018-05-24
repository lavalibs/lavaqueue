const { Client: Lavaqueue } = require('../dist');
const { Client: Gateway } = require('@spectacles/gateway');
const gateway = new Gateway(process.env.TOKEN);
const client = new class extends Lavaqueue {
  constructor() {
    super({
      userID: '218844420613734401',
      password: 'youshallnotpass',
      hosts: {
        ws: 'http://localhost:8080',
        rest: 'http://localhost:8081',
        redis: { host: 'localhost' },
      },
    });
  }

  send(guildID, packet) {
    return gateway.connections.get(0).send(packet);
  }
};

gateway.on('VOICE_STATE_UPDATE', (shard, d) => {
  client.voiceStateUpdate(d);
});
gateway.on('VOICE_SERVER_UPDATE', (shard, d) => {
  client.voiceServerUpdate(d);
});

const queue = client.queues.get('281630801660215296');

gateway.on('MESSAGE_CREATE', async (shard, m) => {
  console.log(m.content);
  try {
    console.log(await eval(m.content));
  } catch (e) {
    console.error(e);
  }
});

(async () => {
  await gateway.spawn();
  await client.queues.redis.flushall();

  const songs = await client.load('https://twitch.tv/monstercat');
  const queue = await client.queues.get('281630801660215296');

  await queue.add(...songs.map(s => s.track));
  await queue.player.join('281630801660215297');
  await queue.start();
})();
