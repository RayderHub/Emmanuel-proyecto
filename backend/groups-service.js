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

fastify.get('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { data: perms } = await supabase.from('group_permissions').select('user_id').eq('group_id', groupId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });
  const { data: users } = await supabase.from('users').select('*').in('id', perms.map(p => p.user_id));
  const mapped = (users || []).map(u => ({ ...u, fullName: u.full_name }));
  return reply.send({ statusCode: 200, data: mapped });
});

fastify.post('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { userId } = request.body;
  await supabase.from('group_permissions').insert([{ group_id: groupId, user_id: userId, permission: 'ticket:view' }]);
  return reply.send({ statusCode: 200, message: 'User added' });
});

// --- ESTUDIANTES ---
fastify.get('/students', async (request, reply) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return reply.status(500).send(error);
  const mapped = data.map(s => ({ ...s, fullName: s.full_name }));
  return reply.send({ statusCode: 200, intOpCode: 'SxST200', data: mapped });
});

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`Groups/Students service running at 3003`);
});
