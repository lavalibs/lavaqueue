local KEY = KEYS[1]
local FROM = tonumber(ARGV[1])
local TO = tonumber(ARGV[2])

if FROM == nil or FROM < 0 then return redis.redis_error('origin must be a positive number') end
if TO == nil or TO < 0 then return redis.redis_error('destination must be a positive number') end

local list = redis.call('lrange', KEY, 0, -1)

-- list is reversed, and provided indexes are 0-based
local val = table.remove(list, #list - FROM)
table.insert(list, #list - TO + 1, val)

redis.call('del', KEY)
redis.call('rpush', KEY, unpack(list))
return list
