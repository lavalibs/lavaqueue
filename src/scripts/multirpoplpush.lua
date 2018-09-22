local SOURCE = KEYS[1]
local DESTINATION = KEYS[2]
local COUNT = tonumber(ARGV[1])

if COUNT == 1 then -- if there's only one, redis has a built-in command for this
  local key = redis.call('rpoplpush', SOURCE, DESTINATION)

  if key then return {key} end
  return {}
end

if COUNT <= 0 then return {} end

elems = {}
for i = 1, COUNT do
  elems[i] = redis.call('rpop', SOURCE) -- pop elements into a table
end

redis.call('lpush', DESTINATION, unpack(elems)) -- put the elements into the destination
return elems
