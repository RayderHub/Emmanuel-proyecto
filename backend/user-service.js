const fastify = require('fastify')({ logger: true });
const supabase = require('./db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-school-project'; 

fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) return reply.status(403).send({ statusCode: 403, message: "Error" });

  const userId = authData.user.id;
  const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
  const { data: groupPerms } = await supabase.from('group_permissions').select('permission').eq('user_id', userId);

  let permissions = (user && user.permissions) ? [...user.permissions] : [];
  if (groupPerms) groupPerms.forEach(p => permissions.push(p.permission));
  if (user && user.role === 'admin') permissions = [...new Set([...permissions, 'ticket:view', 'tickets:view', 'group:view', 'groups:manage', 'users:manage', 'tickets:add', 'tickets:move', 'tickets:delete', 'admin:all'])];

  const token = jwt.sign({ userId, email, role: user?.role || 'user', permissions: [...new Set(permissions)] }, JWT_SECRET, { expiresIn: '24h' });
  return reply.send({ statusCode: 200, data: [{ token, user: { id: userId, username: email, name: user?.full_name || email, role: user?.role } }] });
});

fastify.post('/auth/register', async (request, reply) => {
  const { email, password, fullName } = request.body;
  const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
  if (authError) return reply.status(400).send({ statusCode: 400, message: authError.message });

  await supabase.from('users').insert([{ id: authData.user.id, username: email, full_name: fullName, role: 'user', permissions: ['ticket:view', 'group:view'] }]);
  return reply.send({ statusCode: 200, data: [{ id: authData.user.id, email }] });
});

fastify.get('/users', async (request, reply) => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) return reply.status(500).send(error);
  const mapped = data.map(u => ({ ...u, fullName: u.full_name }));
  return reply.send({ statusCode: 200, data: mapped });
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`User service running at 3001`);
});
