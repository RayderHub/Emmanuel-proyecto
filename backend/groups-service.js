const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// --- RUTAS DE GRUPOS ---

// Listar todos los grupos (Admin)
fastify.get('/groups', async (request, reply) => {
  const { data, error } = await supabase.from('groups').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// Listar miembros de un grupo (FIX para el botón Miembros y Permisos)
fastify.get('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  // Buscamos usuarios que tengan algún permiso en este grupo
  const { data: perms } = await supabase.from('group_permissions').select('user_id').eq('group_id', groupId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });

  const userIds = [...new Set(perms.map(p => p.user_id))];
  const { data: users, error } = await supabase.from('users').select('*').in('id', userIds);
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: users });
});

// Listar grupos de un usuario (Dashboard/Login)
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

// --- RUTAS DE ESTUDIANTES ---
fastify.get('/students', async (request, reply) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// --- RUTAS DE USUARIOS Y PERMISOS ---
fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

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
  console.log(`Groups Service listening at ${address}`);
});
