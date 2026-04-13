const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// --- GRUPOS ---
fastify.get('/groups', async (request, reply) => {
  const { data, error } = await supabase.from('groups').select('*');
  if (error) return reply.status(500).send(error);
  // Devolvemos el array directamente si el frontend lo pide así, o envuelto
  return reply.send({ statusCode: 200, data: data || [] });
});

fastify.get('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { data: perms } = await supabase.from('group_permissions').select('user_id').eq('group_id', groupId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });
  const userIds = [...new Set(perms.map(p => p.user_id))];
  const { data: users } = await supabase.from('users').select('*').in('id', userIds);
  return reply.send({ statusCode: 200, data: users || [] });
});

// --- ESTUDIANTES (Corregido para el componente Alumnos) ---
fastify.get('/students', async (request, reply) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return reply.status(500).send(error);
  
  // IMPORTANTE: Nos aseguramos de enviar un objeto con la propiedad data
  return reply.send({ 
    statusCode: 200, 
    intOpCode: 'SxST200', 
    data: data || [] 
  });
});

// --- EL RESTO DE RUTAS IGUAL ---
fastify.get('/users/:userId/groups', async (request, reply) => {
  const { userId } = request.params;
  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
  if (user && user.role === 'admin') {
    const { data: allGroups } = await supabase.from('groups').select('*');
    return reply.send({ statusCode: 200, data: allGroups });
  }
  const { data: perms } = await supabase.from('group_permissions').select('group_id').eq('user_id', userId);
  const { data: groups } = await supabase.from('groups').select('*').in('id', perms?.map(p => p.group_id) || []);
  return reply.send({ statusCode: 200, data: groups || [] });
});

fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data || [] });
});

fastify.patch('/groups/:id', async (request, reply) => {
  const { data, error } = await supabase.from('groups').update(request.body).eq('id', request.params.id).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [data] });
});

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Service running at ${address}`);
});
