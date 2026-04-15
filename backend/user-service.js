const fastify = require('fastify')({ logger: true });
const supabase = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-school-project'; 

// REGISTRO UNIFICADO (Guarda todos los datos)
fastify.post('/auth/register', async (request, reply) => {
  const { email, password, fullName, phone, address, birthDate } = request.body;
  
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return reply.status(400).send({ statusCode: 400, message: authError.message });

  // Guardamos TODO en la tabla users
  await supabase.from('users').insert([{ 
    id: authData.user.id, 
    username: email, 
    full_name: fullName, 
    role: 'user', 
    // Permisos iniciales con claves canónicas actuales (no legacy)
    permissions: ['user:edit-self', 'group:view', 'ticket:view'],
    phone: phone || null,
    address: address || null,
    birth_date: birthDate || null
  }]);

  return reply.send({ statusCode: 200, data: [{ id: authData.user.id, email }] });
});

// LOGIN (Sin cambios)
fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) return reply.status(403).send({ statusCode: 403, message: "Error" });
  const userId = authData.user.id;
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  const { data: groupPerms } = await supabase.from('group_permissions').select('permission').eq('user_id', userId);
  let permissions = (user && user.permissions) ? [...user.permissions] : [];
  if (groupPerms) groupPerms.forEach(p => permissions.push(p.permission));
  if (user && user.role === 'admin') {
    // Claves canónicas exactas que usa el frontend en allPermissions
    const ALL_PERMS = [
      'pdf:add', 'pdf:move', 'pdf:groups', 'pdf:users',
      'user:edit-self', 'user:add', 'user:edit', 'user:manage', 'user:delete',
      'group:view', 'group:add', 'group:edit', 'group:manage', 'group:delete',
      'ticket:view', 'ticket:add', 'ticket:edit', 'ticket:comment',
      'ticket:move', 'ticket:manage', 'ticket:delete'
    ];
    permissions = ALL_PERMS;
  }
  const token = jwt.sign(
    { userId, email, role: user?.role || 'user', permissions: [...new Set(permissions)] },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  return reply.send({ statusCode: 200, data: [{ token, user: { id: userId, username: email, name: user?.full_name || email, role: user?.role } }] });
});

// LISTAR Y EDITAR USUARIOS (Con todos los campos)
fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return reply.status(500).send(error);
  const mapped = data.map(u => ({ ...u, fullName: u.full_name, birthDate: u.birth_date }));
  return reply.send({ statusCode: 200, data: mapped });
});

fastify.patch('/users/:id', async (request, reply) => {
  const { id } = request.params;
  const { permissions, role, full_name, fullName, phone, address, birthDate, birth_date } = request.body;
  const updateData = { ...request.body };
  // Limpieza de nombres de campos para la base de datos
  if (fullName) { updateData.full_name = fullName; delete updateData.fullName; }
  if (birthDate) { updateData.birth_date = birthDate; delete updateData.birthDate; }

  const { data, error } = await supabase.from('users').update(updateData).eq('id', id).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [data] });
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`User service operational`);
});
