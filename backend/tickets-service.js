const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// Función helper para enviar datos a Angular (CamelCase)
const mapToFrontend = (t) => ({
  ...t,
  groupId: t.group_id,
  assignedTo: t.assigned_to
});

// Función helper para recibir datos de Angular (snake_case)
const mapToBackend = (body) => {
  const newBody = { ...body };
  if (newBody.groupId) {
    newBody.group_id = newBody.groupId;
    delete newBody.groupId;
  }
  if (newBody.assignedTo) {
    newBody.assigned_to = newBody.assignedTo;
    delete newBody.assignedTo;
  }
  return newBody;
};

// LISTAR
fastify.get('/tickets', async (request, reply) => {
  const { groupId } = request.query;
  let query = supabase.from('tickets').select('*');
  if (groupId) query = query.eq('group_id', groupId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return reply.status(500).send(error);
  
  return reply.send({ statusCode: 200, data: (data || []).map(mapToFrontend) });
});

// CREAR
fastify.post('/tickets', async (request, reply) => {
  const dbBody = mapToBackend(request.body);
  const { data, error } = await supabase.from('tickets').insert([dbBody]).select().single();

  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [mapToFrontend(data)] });
});

// ACTUALIZAR (PERSISTENCIA DEL KANBAN)
fastify.patch('/tickets/:id', async (request, reply) => {
  const { id } = request.params;
  const dbBody = mapToBackend(request.body);

  const { data, error } = await supabase
    .from('tickets')
    .update(dbBody)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error("Update Error:", error);
    return reply.status(500).send(error);
  }
  
  return reply.send({ statusCode: 200, data: [mapToFrontend(data)] });
});

fastify.delete('/tickets/:id', async (request, reply) => {
  await supabase.from('tickets').delete().eq('id', request.params.id);
  return reply.send({ statusCode: 200, message: 'Deleted' });
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`Tickets service operational`);
});
