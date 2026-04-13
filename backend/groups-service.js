const fastify = require('fastify')({ logger: true });
const db = require('./db');
const crypto = require('crypto');

fastify.get('/groups', async (request, reply) => {
  const userId = request.headers['x-user-id']; // Passed by API Gateway
  return new Promise((resolve) => {
    db.all(`SELECT g.* FROM groups g JOIN group_users gu ON g.id = gu.group_id WHERE gu.user_id = ?`, [userId], (err, rows) => {
      if (err) {
        resolve(reply.status(500).send({ statusCode: 500, intOpCode: 'SxGP500', data: null }));
      } else {
        resolve(reply.send({ statusCode: 200, intOpCode: 'SxGP200', data: rows }));
      }
    });
  });
});

fastify.post('/groups', async (request, reply) => {
  const { name } = request.body;
  const id = crypto.randomUUID();
  const userId = request.headers['x-user-id']; // Author of the group
  
  return new Promise((resolve) => {
    db.serialize(() => {
      db.run(`INSERT INTO groups (id, name) VALUES (?, ?)`, [id, name]);
      // Give the creator manage permissions
      db.run(`INSERT INTO group_users (group_id, user_id, permissions) VALUES (?, ?, ?)`, 
        [id, userId, JSON.stringify(['tickets:add', 'tickets:move', 'groups:manage', 'users:manage'])], 
        function(err) {
          if (err) {
            resolve(reply.status(500).send({ statusCode: 500, intOpCode: 'SxGP500', data: null }));
          } else {
            resolve(reply.send({ statusCode: 200, intOpCode: 'SxGP200', data: [{ id, name }] }));
          }
        });
    });
  });
});

fastify.get('/users', async (request, reply) => {
  return new Promise((resolve) => {
    db.all(`SELECT id, email, full_name, created_at FROM users`, [], (err, rows) => {
      if (err) {
        resolve(reply.status(500).send({ statusCode: 500, intOpCode: 'SxGP500', data: null }));
      } else {
        resolve(reply.send({ statusCode: 200, intOpCode: 'SxGP200', data: rows }));
      }
    });
  });
});

fastify.post('/groups/:groupId/users', async (request, reply) => {
  const { groupId } = request.params;
  const { userId, permissions } = request.body;
  
  return new Promise((resolve) => {
    db.run(`INSERT OR REPLACE INTO group_users (group_id, user_id, permissions) VALUES (?, ?, ?)`,
      [groupId, userId, JSON.stringify(permissions || [])],
      function(err) {
        if (err) {
          resolve(reply.status(500).send({ statusCode: 500, intOpCode: 'SxGP500', data: null }));
        } else {
          resolve(reply.send({ statusCode: 200, intOpCode: 'SxGP200', data: [{ groupId, userId, permissions }] }));
        }
      }
    );
  });
});

fastify.listen({ port: 3003 }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`Groups Service listening at ${address}`);
});
