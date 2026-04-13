const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// --- ESTUDIANTES (Mapeo de nombres corregido) ---
fastify.get('/students', async (request, reply) => {
  const { data, error } = await supabase.from('students').select('*');
  if (error) return reply.status(500).send(error);
  
  // MAPEO CRÍTICO: full_name -> fullName
  const mapped = data.map(s => ({
    ...s,
    fullName: s.full_name,
    birthDate: s.birth_date // También mapeamos la fecha
  }));

  return reply.send({ statusCode: 200, intOpCode: 'SxST200', data: mapped });
});

// --- GRUPOS Y USUARIOS ---
fastify.get('/groups', async (request, reply) => {
  const { data, error } = await supabase.from('groups').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data || [] });
});

fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  const mapped = data.map(u => ({ ...u, fullName: u.full_name }));
  return reply.send({ statusCode: 200, data: mapped });
});

// ... resto de rutas (mantener igual que el anterior write_to_file de Turn 44)
fastify.post('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { userId } = request.body;
  const { data, error } = await supabase.from('group_permissions').insert([{ group_id: groupId, user_id: userId, permission: 'ticket:view' }]).select();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Groups Service operational`);
});
