const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

fastify.get('/tickets', async (request, reply) => {
  const { groupId } = request.query;
  let query = supabase.from('tickets').select('*');
  if (groupId) query = query.eq('group_id', groupId);
  
  const { data, error } = await query;
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
  const { title, description, status, priority, assigned_to } = request.body;
  const { id } = request.params;
  
  const { data, error } = await supabase.from('tickets').update({ 
    title, description, status, priority, assigned_to 
  }).eq('id', id).select().single();

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
  console.log(`Tickets Service listening at ${address}`);
});
