const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// Listar tickets (con soporte para admin y filtros)
fastify.get('/tickets', async (request, reply) => {
  const { groupId, userId } = request.query;
  
  let query = supabase.from('tickets').select('*');

  // Si se pide un grupo específico, filtramos por él
  if (groupId) {
    query = query.eq('group_id', groupId);
  } 
  // Si no hay grupo pero hay usuario, podríamos filtrar por los del usuario (opcional)
  else if (userId) {
    // Primero vemos en qué grupos está el usuario
    const { data: perms } = await supabase.from('group_permissions').select('group_id').eq('user_id', userId);
    if (perms && perms.length > 0) {
      query = query.in('group_id', perms.map(p => p.group_id));
    }
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data });
});

fastify.post('/tickets', async (request, reply) => {
  const { title, description, status, priority, assigned_to, group_id } = request.body;
  const { data, error } = await supabase.from('tickets').insert([{ 
    title, description, status: status || 'To-Do', priority: priority || 'Low', assigned_to, group_id 
  }]).select().single();

  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [data] });
});

fastify.patch('/tickets/:id', async (request, reply) => {
  const { id } = request.params;
  const { data, error } = await supabase.from('tickets').update(request.body).eq('id', id).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [data] });
});

fastify.delete('/tickets/:id', async (request, reply) => {
  const { id } = request.params;
  const { error } = await supabase.from('tickets').delete().eq('id', id);
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, message: 'Ticket deleted' });
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Tickets Service running at ${address}`);
});
