const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// Listar grupos del usuario
fastify.get('/groups', async (request, reply) => {
  const userId = request.headers['x-user-id']; 
  const { data: perms } = await supabase.from('group_permissions').select('group_id').eq('user_id', userId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });

  const groupIds = perms.map(p => p.group_id);
  const { data: groups, error } = await supabase.from('groups').select('*').in('id', groupIds);
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: groups });
});

// Crear grupo
fastify.post('/groups', async (request, reply) => {
  const { name, description, course, semester } = request.body;
  const userId = request.headers['x-user-id']; 
  
  const { data: group, error } = await supabase.from('groups').insert([{ name, description, course, semester }]).select().single();
  if (error) return reply.status(500).send(error);

  // Asignar permisos de admin al creador
  await supabase.from('group_permissions').insert([
    { group_id: group.id, user_id: userId, permission: 'groups:manage' },
    { group_id: group.id, user_id: userId, permission: 'users:manage' },
    { group_id: group.id, user_id: userId, permission: 'tickets:add' },
    { group_id: group.id, user_id: userId, permission: 'tickets:move' }
  ]);

  return reply.send({ statusCode: 200, data: [group] });
});

// Listar todos los usuarios
fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// Obtener permisos de un usuario en un grupo (IMPORTANTE para el frontend)
fastify.get('/groups/:groupId/users/:userId/permissions', async (request, reply) => {
  const { groupId, userId } = request.params;
  const { data, error } = await supabase.from('group_permissions').select('permission').eq('group_id', groupId).eq('user_id', userId);
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data.map(p => p.permission) });
});

// Guardar permisos
fastify.patch('/groups/:groupId/users/:userId/permissions', async (request, reply) => {
  const { groupId, userId } = request.params;
  const { permissions } = request.body; // array de strings
  
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
