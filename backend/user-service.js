const fastify = require('fastify')({ logger: true });
const supabase = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-school-project'; 

fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  // En tu esquema, el login se basa en la tabla users vinculada a Auth
  // Buscamos por username (que suele ser el email)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', email)
    .single();

  if (userError || !user) {
    return reply.status(403).send({ statusCode: 403, intOpCode: 'SxUS403', data: null, message: "Usuario no encontrado" });
  }

  // Nota: En un sistema real usarías Supabase Auth directamente, 
  // pero siguiendo tu lógica de microservicios:
  
  // Buscamos sus permisos globales y por grupo
  const { data: groupPerms, error: permError } = await supabase
    .from('group_permissions')
    .select('group_id, permission')
    .eq('user_id', user.id);

  let permissions = user.permissions || []; // Permisos globales de la tabla users
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
    userId: user.id, 
    email: user.username,
    role: user.role,
    permissions, 
    groupPermissions 
  }, JWT_SECRET, { expiresIn: '24h' });

  return reply.send({ 
    statusCode: 200, 
    intOpCode: 'SxUS200', 
    data: [{ token, user: { id: user.id, username: user.username, name: user.full_name } }] 
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
