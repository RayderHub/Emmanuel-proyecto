const fastify = require('fastify')({ logger: true });
const db = require('./db');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-key-for-school-project'; // In real life, use an env var

fastify.post('/auth/register', async (request, reply) => {
  const { email, password, fullName } = request.body;
  if (!email || !password) {
    return reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: null, message: "Missing email or password" });
  }

  const id = crypto.randomUUID();
  
  return new Promise((resolve) => {
    db.run(`INSERT INTO users (id, email, password, full_name) VALUES (?, ?, ?, ?)`, 
      [id, email, password, fullName || ''], 
      function(err) {
        if (err) {
          fastify.log.error(err);
          resolve(reply.status(400).send({ statusCode: 400, intOpCode: 'SxUS400', data: null, message: "Email already exists" }));
        } else {
          resolve(reply.send({ statusCode: 200, intOpCode: 'SxUS200', data: [{ id, email }] }));
        }
    });
  });
});

fastify.post('/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  return new Promise((resolve) => {
    db.get(`SELECT * FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
      if (err || !user) {
        resolve(reply.status(403).send({ statusCode: 403, intOpCode: 'SxUS403', data: null, message: "Invalid credentials" }));
        return;
      }

      // Fetch all group permissions for the user
      db.all(`SELECT group_id, permissions FROM group_users WHERE user_id = ?`, [user.id], (err, rows) => {
        let permissions = []; // Simplified flat permissions for all groups to adapt to the pdf initially, but ideally we should group them by groupId.
        // The PDF says "Lista de permisos por grupo (o un identificador que permita recuperarlos rápidamente)." 
        // We will include groupPermissions inside the token.
        const groupPermissions = {};
        if (rows) {
          rows.forEach(row => {
            try {
              groupPermissions[row.group_id] = JSON.parse(row.permissions);
              permissions = permissions.concat(JSON.parse(row.permissions));
            } catch(e){}
          });
        }
        
        // Remove duplicates
        permissions = [...new Set(permissions)];

        const token = jwt.sign({ 
          userId: user.id, 
          email: user.email,
          permissions, // All permissions extracted
          groupPermissions 
        }, JWT_SECRET, { expiresIn: '24h' });

        resolve(reply.send({ 
          statusCode: 200, 
          intOpCode: 'SxUS200', 
          data: [{ token, user: { id: user.id, email: user.email, name: user.full_name } }] 
        }));
      });
    });
  });
});

fastify.listen({ port: 3001 }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`User Service listening at ${address}`);
});
