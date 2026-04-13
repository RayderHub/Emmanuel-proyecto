const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

fastify.get('/groups', async (request, reply) => {
  const userId = request.headers['x-user-id']; 
  
  // En tu esquema, buscamos los grupos donde el usuario tiene permisos
  const { data: perms, error: permError } = await supabase
    .from('group_permissions')
    .select('group_id')
    .eq('user_id', userId);

  if (permError || !perms) {
    return reply.status(200).send({ statusCode: 200, data: [] });
  }

  const groupIds = perms.map(p => p.group_id);

  const { data: groups, error: groupError } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);

  if (groupError) {
    return reply.status(500).send({ statusCode: 500, intOpCode: 'SxGP500', data: null, message: groupError.message });
  }
  return reply.send({ statusCode: 200, intOpCode: 'SxGP200', data: groups });
});

fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, username, full_name, role');

  if (error) {
    return reply.status(500).send({ statusCode: 500, intOpCode: 'SxGP500', data: null, message: error.message });
  }
  return reply.send({ statusCode: 200, intOpCode: 'SxGP200', data: data });
});

fastify.post('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { userId, permissions } = request.body; // array de strings
  
  // Borramos permisos anteriores e insertamos los nuevos
  await supabase.from('group_permissions').delete().eq('group_id', parseInt(groupId)).eq('user_id', userId);

  const inserts = permissions.map(p => ({
    group_id: parseInt(groupId),
    user_id: userId,
    permission: p
  }));

  const { data, error } = await supabase
    .from('group_permissions')
    .insert(inserts)
    .select();

  if (error) {
    return reply.status(500).send({ statusCode: 500, intOpCode: 'SxGP500', data: null, message: error.message });
  }
  return reply.send({ statusCode: 200, intOpCode: 'SxGP200', data: data });
});

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Groups Service listening at ${address}`);
});
