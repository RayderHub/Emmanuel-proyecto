const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// RUTA CORREGIDA: Listar grupos del usuario (usada en el login y dashboard)
fastify.get('/users/:userId/groups', async (request, reply) => {
  const { userId } = request.params;
  
  // 1. Obtener el rol del usuario para saber si es admin
  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
  
  // 2. Si es ADMIN, le devolvemos TODOS los grupos del sistema
  if (user && user.role === 'admin') {
    const { data: allGroups, error } = await supabase.from('groups').select('*');
    if (error) return reply.status(500).send(error);
    return reply.send({ statusCode: 200, data: allGroups });
  }

  // 3. Si no es admin, solo los suyos
  const { data: perms } = await supabase.from('group_permissions').select('group_id').eq('user_id', userId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });

  const groupIds = perms.map(p => p.group_id);
  const { data: groups, error } = await supabase.from('groups').select('*').in('id', groupIds);
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: groups });
});

// Listar todos los usuarios con sus permisos (para el admin)
fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// Listar todos los alumnos del sistema (para la sección que mencionas)
fastify.get('/students', async (request, reply) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// Rutas de permisos
fastify.get('/groups/:groupId/users/:userId/permissions', async (request, reply) => {
  const { groupId, userId } = request.params;
  const { data, error } = await supabase.from('group_permissions').select('permission').eq('group_id', groupId).eq('user_id', userId);
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data.map(p => p.permission) });
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
  console.log(`Groups Service listening at ${address}`);
});
