const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// Función helper para mapear a CamelCase (lo que Angular espera)
const mapTicket = (t) => ({
  ...t,
  groupId: t.group_id,      // Mapeo crítico para el Kanban
  assignedTo: t.assigned_to // Mapeo para el responsable
});

// LISTAR TICKETS
fastify.get('/tickets', async (request, reply) => {
  const { groupId } = request.query;
  let query = supabase.from('tickets').select('*');
  if (groupId) query = query.eq('group_id', groupId);
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return reply.status(500).send(error);
  
  const mappedData = (data || []).map(mapTicket);
  return reply.send({ statusCode: 200, data: mappedData });
});

// CREAR TICKET
fastify.post('/tickets', async (request, reply) => {
  const { title, description, status, priority, assigned_to, group_id, groupId } = request.body;
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
  
  // Enviamos el ticket mapeado de vuelta
  return reply.send({ statusCode: 200, data: [mapTicket(data)] });
});

// EDITAR TICKET
fastify.patch('/tickets/:id', async (request, reply) => {
  const { data, error } = await supabase.from('tickets').update(request.body).eq('id', request.params.id).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [mapTicket(data)] });
});

fastify.delete('/tickets/:id', async (request, reply) => {
  const { error } = await supabase.from('tickets').delete().eq('id', request.params.id);
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, message: 'Ticket deleted' });
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`Tickets service operational`);
});
