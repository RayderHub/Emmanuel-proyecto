const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// Listar tickets
fastify.get('/tickets', async (request, reply) => {
  const { groupId } = request.query;
  let query = supabase.from('tickets').select('*');
  if (groupId) query = query.eq('group_id', groupId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: data || [] });
});

// CREAR TICKET (Ajustado para el Frontend)
fastify.post('/tickets', async (request, reply) => {
  const { title, description, status, priority, assigned_to, group_id, groupId } = request.body;
  
  // Algunos componentes envían 'groupId' (camelCase), otros 'group_id'
  const finalGroupId = groupId || group_id;

  const { data, error } = await supabase.from('tickets').insert([{ 
    title, 
    description, 
    status: status || 'pendiente', 
    priority: priority || 'baja', 
    assigned_to, 
    group_id: finalGroupId 
  }]).select().single();

  if (error) return reply.status(500).send(error);
  
  // El frontend espera el objeto dentro de un array 'data'
  return reply.send({ statusCode: 200, data: [data] });
});

fastify.patch('/tickets/:id', async (request, reply) => {
  const { data, error } = await supabase.from('tickets').update(request.body).eq('id', request.params.id).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [data] });
});

fastify.delete('/tickets/:id', async (request, reply) => {
  const { error } = await supabase.from('tickets').delete().eq('id', request.params.id);
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, message: 'Ticket deleted' });
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Tickets Service running`);
});
