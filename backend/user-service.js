const fastify = require('fastify')({ logger: true });
const supabase = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-school-project'; 

// --- LOGIN ---
fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return reply.status(403).send({ statusCode: 403, message: "Usuario o contraseña incorrectos" });
  }

  const userId = authData.user.id;

  // Obtener perfil global
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  // Obtener permisos por grupo
  const { data: groupPerms } = await supabase.from('group_permissions').select('group_id, permission').eq('user_id', userId);

  // FUSIONAR PERMISOS
  let permissions = (user && user.permissions) ? [...user.permissions] : [];
  const groupPermissions = {};

  if (groupPerms) {
    groupPerms.forEach(row => {
      if (!groupPermissions[row.group_id]) groupPermissions[row.group_id] = [];
      groupPermissions[row.group_id].push(row.permission);
      permissions.push(row.permission); // Añadimos a la lista global para visibilidad
    });
  }

  // Si es ADMIN, le damos permisos totales por si acaso faltan en la DB
  if (user && user.role === 'admin') {
    const adminPerms = ['tickets:view', 'group:view', 'groups:manage', 'users:manage', 'tickets:add', 'tickets:move', 'tickets:delete', 'admin:all'];
    permissions = [...new Set([...permissions, ...adminPerms])];
  } else {
    permissions = [...new Set(permissions)];
  }

  const token = jwt.sign({ 
    userId, email, role: user?.role || 'user', permissions, groupPermissions 
  }, JWT_SECRET, { expiresIn: '24h' });

  return reply.send({ 
    statusCode: 200, 
    data: [{ 
      token, 
      user: { id: userId, username: email, name: user?.full_name || email.split('@')[0], role: user?.role } 
    }] 
  });
});

// --- REGISTRO ---
fastify.post('/auth/register', async (request, reply) => {
  const { email, password, fullName } = request.body;
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

  if (authError || !authData.user) {
    return reply.status(400).send({ statusCode: 400, message: authError.message });
  }

  const { error: userError } = await supabase.from('users').insert([{ 
    id: authData.user.id, 
    username: email, 
    full_name: fullName || email.split('@')[0],
    role: 'user',
    permissions: ['group:view', 'tickets:view'] // Permisos base
  }]);

  if (userError) return reply.status(400).send({ statusCode: 400, message: "Error al guardar perfil" });

  return reply.send({ statusCode: 200, data: [{ id: authData.user.id, email }] });
});

fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`User Service running at ${address}`);
});
