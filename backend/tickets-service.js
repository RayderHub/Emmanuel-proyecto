const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

fastify.get('/tickets', async (request, reply) => {
  const { groupId } = request.query;
  
  let query = supabase.from('tickets').select('*');
  if (groupId) {
    query = query.eq('group_id', parseInt(groupId));
  }
  
  const { data, error } = await query;

  if (error) {
    return reply.status(500).send({ statusCode: 500, intOpCode: 'SxTK500', data: null, message: error.message });
  }
  return reply.send({ statusCode: 200, intOpCode: 'SxTK200', data: data });
});

fastify.post('/tickets', async (request, reply) => {
  const { title, description, status, priority, assigned_to, group_id } = request.body;
  
  const { data, error } = await supabase
    .from('tickets')
    .insert([{ 
      title, 
      description, 
      status: status || 'To-Do', 
      priority: priority || 'Low', 
      assigned_to, 
      group_id: parseInt(group_id)
    }])
    .select();

  if (error) {
    return reply.status(500).send({ statusCode: 500, intOpCode: 'SxTK500', data: null, message: error.message });
  }
  return reply.send({ statusCode: 200, intOpCode: 'SxTK200', data: data });
});

fastify.patch('/tickets/:id/status', async (request, reply) => {
  const { status } = request.body;
  const { id } = request.params;
  
  const { data, error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', parseInt(id))
    .select();

  if (error) {
    return reply.status(500).send({ statusCode: 500, intOpCode: 'SxTK500', data: null, message: error.message });
  }
  return reply.send({ statusCode: 200, intOpCode: 'SxTK200', data: data });
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Tickets Service listening at ${address}`);
});
