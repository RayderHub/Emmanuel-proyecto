const fastify = require('fastify')({ logger: true });
const supabase = require('./db');

// --- TRADUCTOR DEFINITIVO ---
const mapToFrontend = (t) => ({
  ...t,
  groupId:    t.group_id,
  assignedTo:   t.assigned_to,   // UUID del asignado
  assignedToId: t.assigned_to,   // alias para el select del formulario
  dueDate:    t.due_date,        // ← CORREGIDO: antes faltaba este mapeo
  createdAt:  t.created_at,      // ← CORREGIDO: antes faltaba este mapeo
  status: (t.status || 'pendiente').toLowerCase()
});

const mapToBackend = (body) => {
  const newBody = {};
  // Solo permitimos los campos que existen en la DB
  if (body.title)       newBody.title       = body.title;
  if (body.description) newBody.description = body.description;
  if (body.priority)    newBody.priority    = body.priority;
  if (body.status)      newBody.status      = body.status.toLowerCase();

  // ← CORREGIDO: el frontend envía groupId (camelCase)
  if (body.groupId   != null) newBody.group_id   = parseInt(body.groupId);
  if (body.group_id  != null) newBody.group_id   = parseInt(body.group_id);

  // ← CORREGIDO: el selector del formulario usa assignedToId, no assignedTo
  const assignee = body.assignedToId || body.assignedTo || body.assigned_to;
  if (assignee) newBody.assigned_to = assignee;

  // ← CORREGIDO: dueDate nunca se guardaba, ahora sí
  const dueDate = body.dueDate || body.due_date;
  if (dueDate) newBody.due_date = dueDate;

  return newBody;
};

// LISTAR
fastify.get('/tickets', async (request, reply) => {
  const { groupId } = request.query;
  let query = supabase.from('tickets').select('*');
  if (groupId) query = query.eq('group_id', parseInt(groupId));
  
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return reply.status(500).send(error);
  
  return reply.send({ statusCode: 200, data: (data || []).map(mapToFrontend) });
});

// ESQUEMA JSON PARA POST (Requerimiento del profesor)
const createTicketSchema = {
  schema: {
    body: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', maxLength: 100 },
        description: { type: 'string' },
        priority: { enum: ['baja', 'media', 'alta', 'urgente'] },
        status: { enum: ['pendiente', 'en-proceso', 'revision', 'finalizado'] }
      }
    }
  }
};

// CREAR
fastify.post('/tickets', createTicketSchema, async (request, reply) => {
  const dbBody = mapToBackend(request.body);
  const { data, error } = await supabase.from('tickets').insert([dbBody]).select().single();
  if (error) return reply.status(500).send(error);
  return reply.send({ statusCode: 200, data: [mapToFrontend(data)] });
});

// ACTUALIZAR (¡ESTO ARREGLA LA PERSISTENCIA!)
fastify.patch('/tickets/:id', async (request, reply) => {
  const id = parseInt(request.params.id); // ¡CRÍTICO: Convertir a número!
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
  await supabase.from('tickets').delete().eq('id', parseInt(request.params.id));
  return reply.send({ statusCode: 200, message: 'Deleted' });
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err) => {
  if (err) process.exit(1);
  console.log(`Tickets service operational`);
});
