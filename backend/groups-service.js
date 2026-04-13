const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// --- GRUPOS ---
fastify.get('/groups', async (request, reply) => {
  const { data, error } = await supabase.from('groups').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data || [] });
});

fastify.post('/groups', async (request, reply) => {
  const { data, error } = await supabase.from('groups').insert([request.body]).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [data] });
});

fastify.patch('/groups/:id', async (request, reply) => {
  const { data, error } = await supabase.from('groups').update(request.body).eq('id', request.params.id).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [data] });
});

// --- MIEMBROS DE GRUPO ---

// Obtener usuarios de un grupo
fastify.get('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { data: perms } = await supabase.from('group_permissions').select('user_id').eq('group_id', groupId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });
  const userIds = [...new Set(perms.map(p => p.user_id))];
  const { data: users } = await supabase.from('users').select('*').in('id', userIds);
  return reply.send({ statusCode: 200, data: users || [] });
});

// AGREGAR MIEMBRO A GRUPO (La ruta que faltaba)
fastify.post('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { userId } = request.body;
  // Al agregar un miembro, le damos un permiso base para que aparezca
  const { data, error } = await supabase.from('group_permissions').insert([{ 
    group_id: groupId, user_id: userId, permission: 'group:view' 
  }]).select();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

// --- ESTUDIANTES REALES ---
fastify.get('/students', async (request, reply) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data || [] });
});

fastify.post('/students', async (request, reply) => {
  const { data, error } = await supabase.from('students').insert([request.body]).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [data] });
});

// --- PERMISOS ---
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

// Listar usuarios para el buscador de miembros
fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data || [] });
});

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Groups Service running at ${address}`);
});
