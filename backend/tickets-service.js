const fastify = require('fastify')({ logger: true });
const db = require('./db');
const crypto = require('crypto');

fastify.get('/tickets', async (request, reply) => {
  const { groupId } = request.query;
  
  return new Promise((resolve) => {
    let query = `SELECT * FROM tickets`;
    let params = [];
    if (groupId) {
      query += ` WHERE group_id = ?`;
      params.push(groupId);
    }
    db.all(query, params, (err, rows) => {
      if (err) {
         resolve(reply.status(500).send({ statusCode: 500, intOpCode: 'SxTK500', data: null, message: err.message }));
      } else {
         resolve(reply.send({ statusCode: 200, intOpCode: 'SxTK200', data: rows }));
      }
    });
  });
});

fastify.post('/tickets', async (request, reply) => {
  const { title, description, status, priority, assignee_id, group_id } = request.body;
  const id = crypto.randomUUID();
  
  return new Promise((resolve) => {
    db.run(`INSERT INTO tickets (id, title, description, status, priority, assignee_id, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, title, description, status || 'To-Do', priority || 'Low', assignee_id, group_id],
      function(err) {
        if (err) {
          resolve(reply.status(500).send({ statusCode: 500, intOpCode: 'SxTK500', data: null, message: err.message }));
        } else {
          resolve(reply.send({ statusCode: 200, intOpCode: 'SxTK200', data: [{ id, title, status }] }));
        }
      }
    )
  });
});

fastify.patch('/tickets/:id/status', async (request, reply) => {
  const { status } = request.body;
  const { id } = request.params;
  
  return new Promise((resolve) => {
    db.run(`UPDATE tickets SET status = ? WHERE id = ?`, [status, id], function(err) {
      if (err) {
         resolve(reply.status(500).send({ statusCode: 500, intOpCode: 'SxTK500', data: null }));
      } else {
         resolve(reply.send({ statusCode: 200, intOpCode: 'SxTK200', data: [{ id, status }] }));
      }
    });
  });
});

fastify.listen({ port: 3002 }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Tickets Service listening at ${address}`);
});
