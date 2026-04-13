const fastify = require('fastify')({ logger: true });
const supabase = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-school-project'; 

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
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  const { data: groupPerms } = await supabase.from('group_permissions').select('group_id, permission').eq('user_id', userId);

  let permissions = (user && user.permissions) ? [...user.permissions] : [];
  
  if (groupPerms) {
    groupPerms.forEach(row => {
      permissions.push(row.permission);
    });
  }

  // FORCE ADMIN PERMISSIONS
  if (user && user.role === 'admin') {
    const adminCore = ['ticket:view', 'tickets:view', 'group:view', 'groups:manage', 'users:manage', 'tickets:add', 'tickets:move', 'tickets:delete', 'admin:all'];
    permissions = [...new Set([...permissions, ...adminCore])];
  }

  const token = jwt.sign({ 
    userId, email, role: user?.role || 'user', permissions: [...new Set(permissions)]
  }, JWT_SECRET, { expiresIn: '24h' });

  return reply.send({ 
    statusCode: 200, 
    data: [{ 
      token, 
      user: { 
        id: userId, 
        username: email, 
        name: user?.full_name || email.split('@')[0], // Mapeo para el header
        role: user?.role 
      } 
    }] 
  });
});

// LISTA DE USUARIOS (Mapeo de fullName para el frontend)
fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('id, username, full_name, role, permissions');
  if (error) return reply.status(500).send(error);
  
  // MAPEO CRÍTICO: full_name -> fullName
  const mapped = data.map(u => ({
    ...u,
    fullName: u.full_name // <--- Esto hace que aparezcan los nombres en la tabla y buscador
  }));
  
  return reply.send({ statusCode: 200, data: mapped });
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`User Service running at ${address}`);
});
