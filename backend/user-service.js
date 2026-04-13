const fastify = require('fastify')({ logger: true });
const supabase = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-school-project'; 

fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  // 1. Intentamos iniciar sesión con el sistema de Auth de Supabase
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (authError || !authData.user) {
    return reply.status(403).send({ 
      statusCode: 403, 
      intOpCode: 'SxUS403', 
      data: null, 
      message: "Credenciales inválidas en Supabase Auth" 
    });
  }

  const userId = authData.user.id;

  // 2. Buscamos los datos adicionales (role, full_name) en tu tabla 'users'
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    // Si no existe en la tabla users, devolvemos datos básicos del perfil de Auth
    fastify.log.warn(`Usuario ${userId} no encontrado en tabla personalizada 'users'`);
  }

  // 3. Buscamos sus permisos por grupo en 'group_permissions'
  const { data: groupPerms } = await supabase
    .from('group_permissions')
    .select('group_id, permission')
    .eq('user_id', userId);

  let permissions = (user && user.permissions) || []; 
  const groupPermissions = {};

  if (groupPerms) {
    groupPerms.forEach(row => {
      if (!groupPermissions[row.group_id]) groupPermissions[row.group_id] = [];
      groupPermissions[row.group_id].push(row.permission);
      permissions.push(row.permission);
    });
  }
  
  permissions = [...new Set(permissions)];

  const token = jwt.sign({ 
    userId: userId, 
    email: email,
    role: user?.role || 'user',
    permissions, 
    groupPermissions 
  }, JWT_SECRET, { expiresIn: '24h' });

  return reply.send({ 
    statusCode: 200, 
    intOpCode: 'SxUS200', 
    data: [{ 
      token, 
      user: { 
        id: userId, 
        username: email, 
        name: user?.full_name || email.split('@')[0] 
      } 
    }] 
  });
});

fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`User Service listening at ${address}`);
});
