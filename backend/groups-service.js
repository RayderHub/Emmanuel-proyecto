const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// --- GRUPOS ---
fastify.get('/groups', async (request, reply) => {
  const { data, error } = await supabase.from('groups').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data || [] });
});

fastify.get('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { data: perms } = await supabase.from('group_permissions').select('user_id').eq('group_id', groupId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });
  const { data: users } = await supabase.from('users').select('*').in('id', perms.map(p => p.user_id));
  const mapped = (users || []).map(u => ({ ...u, fullName: u.full_name }));
  return reply.send({ statusCode: 200, data: mapped });
});

// --- ALUMNOS REALES (Ahora vienen de la tabla Users con rol 'user') ---
fastify.get('/students', async (request, reply) => {
  // Buscamos a todos los usuarios cuyo rol sea 'user'
  const { data, error } = await supabase.from('users')
    .select('*')
    .eq('role', 'user');

  if (error) return reply.status(500).send(error);
  
  // Mapeamos los datos para que Angular los entienda (fullName, email, etc)
  const mapped = (data || []).map(u => ({
    ...u,
    fullName: u.full_name,
    email: u.username, // En tu caso el username es el email
    phone: 'Sin teléfono' // Campo opcional
  }));

  return reply.send({ statusCode: 200, intOpCode: 'SxST200', data: mapped });
});

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`Groups/Students service operational`);
});
