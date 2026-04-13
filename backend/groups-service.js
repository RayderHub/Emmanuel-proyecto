const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// --- GRUPOS ---
fastify.get('/groups', async (request, reply) => {
  const { data, error } = await supabase.from('groups').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data || [] });
});

// --- ALUMNOS (Ahora son usuarios de la tabla 'users') ---
fastify.get('/students', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('*').eq('role', 'user');
  if (error) return reply.status(500).send(error);
  
  const mapped = (data || []).map(u => ({
    ...u,
    fullName: u.full_name,
    email: u.username,
    phone: u.phone || 'Sin teléfono',
    address: u.address || 'Sin dirección',
    birthDate: u.birth_date
  }));

  return reply.send({ statusCode: 200, intOpCode: 'SxST200', data: mapped });
});

// Los demás métodos se mantienen iguales (Turn 44)
fastify.listen({ port: 3003, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`Groups/Students Service Operational`);
});
