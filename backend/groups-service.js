const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// 1. RUTA PARA ADMIN: Listar TODOS los grupos
fastify.get('/groups', async (request, reply) => {
  const { data, error } = await supabase.from('groups').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// 2. RUTA PARA USUARIO: Sus grupos específicos
fastify.get('/users/:userId/groups', async (request, reply) => {
  const { userId } = request.params;
  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
  
  if (user && user.role === 'admin') {
    const { data: allGroups } = await supabase.from('groups').select('*');
    return reply.send({ statusCode: 200, data: allGroups });
  }

  const { data: perms } = await supabase.from('group_permissions').select('group_id').eq('user_id', userId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });

  const { data: groups } = await supabase.from('groups').select('*').in('id', perms.map(p => p.group_id));
  return reply.send({ statusCode: 200, data: groups });
});

// 3. RUTA PARA ESTUDIANTES (El módulo que te faltaba)
fastify.get('/students', async (request, reply) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// 4. Listar usuarios con permisos
fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// 5. Gestión de Permisos
fastify.get('/groups/:groupId/users/:userId/permissions', async (request, reply) => {
  const { groupId, userId } = request.params;
  const { data } = await supabase.from('group_permissions').select('permission').eq('group_id', groupId).eq('user_id', userId);
  return reply.send({ statusCode: 200, data: data?.map(p => p.permission) || [] });
});

fastify.patch('/groups/:groupId/users/:userId/permissions', async (request, reply) => {
  const { groupId, userId } = request.params;
  const { permissions } = request.body;
  await supabase.from('group_permissions').delete().eq('group_id', groupId).eq('user_id', userId);
  const inserts = permissions.map(p => ({ group_id: groupId, user_id: userId, permission: p }));
  const { data, error } = await supabase.from('group_permissions').insert(inserts).select();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Groups/Students Service listening at ${address}`);
});
