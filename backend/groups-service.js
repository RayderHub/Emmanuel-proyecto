const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// --- GRUPOS (CRUD) ---
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
fastify.get('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { data: perms } = await supabase.from('group_permissions').select('user_id').eq('group_id', groupId);
  if (!perms || perms.length === 0) return reply.send({ statusCode: 200, data: [] });
  
  const { data: users } = await supabase.from('users').select('*').in('id', perms.map(p => p.user_id));
  const mapped = (users || []).map(u => ({ ...u, fullName: u.full_name }));
  return reply.send({ statusCode: 200, data: mapped });
});

// ¡ESTA ES LA RUTA QUE SE HABÍA BORRADO!
fastify.post('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { userId } = request.body;
  
  const { error } = await supabase.from('group_permissions').insert([{ 
    group_id: groupId, 
    user_id: userId, 
    permission: 'ticket:view' 
  }]);

  // Sincronización en segundo plano hacia la tabla heredada group_members
  // 1. Buscamos el email del usuario usando su UUID
  // 2. Buscamos el student_id usando su email en la tabla students
  // 3. Insertamos en group_members
  supabase.from('users').select('username').eq('id', userId).single().then(({ data: user }) => {
    if (user && user.username) {
      supabase.from('students').select('id').eq('email', user.username).single().then(({ data: student }) => {
        if (student) {
          supabase.from('group_members')
            .insert({ group_id: groupId, student_id: student.id })
            .then(() => console.log('Sincronizado group_members'));
        }
      });
    }
  });

  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, message: 'Usuario añadido al grupo' });
});

// Grupos a los que pertenece un usuario específico
fastify.get('/users/:userId/groups', async (request, reply) => {
  const { userId } = request.params;
  const { data: memberships } = await supabase
    .from('group_permissions')
    .select('group_id')
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0)
    return reply.send({ statusCode: 200, data: [] });

  const groupIds = [...new Set(memberships.map(m => m.group_id))];
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .in('id', groupIds);

  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: groups || [] });
});

// --- ALUMNOS (Vista unificada desde la tabla Users) ---
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

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`Groups/Students Service Operational`);
});
