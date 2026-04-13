const fastify = require('fastify')({ logger: true });
const supabase = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-school-project'; 

// ─── REGISTRO ──────────────────────────────────────────────────────────────
fastify.post('/auth/register', async (request, reply) => {
  const { email, password, fullName } = request.body;
  
  if (!email || !password) {
    return reply.status(400).send({ statusCode: 400, message: "Faltan datos" });
  }

  // 1. Registrar en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (authError || !authData.user) {
    return reply.status(400).send({ 
      statusCode: 400, 
      message: `Error en Auth: ${authError.message}` 
    });
  }

  const userId = authData.user.id;

  // 2. Crear el perfil en tu tabla personalizada 'users'
  const { error: userError } = await supabase
    .from('users')
    .insert([{ 
      id: userId, 
      username: email, 
      full_name: fullName || email.split('@')[0],
      role: 'user',
      permissions: ['tickets:add'] // Permiso básico por defecto
    }]);

  if (userError) {
    fastify.log.error(userError);
    // Aunque falle aquí, el usuario ya se creó en Auth.
  }

  return reply.send({ 
    statusCode: 200, 
    intOpCode: 'SxUS200', 
    data: [{ id: userId, email }] 
  });
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────
fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  // 1. Validar con Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (authError || !authData.user) {
    return reply.status(403).send({ 
       statusCode: 403, 
       message: "Usuario o contraseña incorrectos en Supabase" 
    });
  }

  const userId = authData.user.id;

  // 2. Obtener datos y permisos
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

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
