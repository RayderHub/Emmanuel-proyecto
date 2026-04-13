const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const fastifyJwt = require('@fastify/jwt');
const rateLimit = require('@fastify/rate-limit');
const proxy = require('@fastify/http-proxy');
const db = require('./db');

const JWT_SECRET = 'super-secret-key-for-school-project';

async function build() {
  await fastify.register(cors, { origin: '*' });

  await fastify.register(fastifyJwt, { secret: JWT_SECRET });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: function (request, context) {
      return {
        statusCode: 429,
        intOpCode: 'SxGW429',
        data: null,
        message: 'Too many requests'
      };
    }
  });

  // Pre-handler metrics logging
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTime = Date.now();
  });

  // Database logging
  fastify.addHook('onResponse', async (request, reply) => {
    const responseTime = Date.now() - request.startTime;
    const userId = request.user ? request.user.userId : null;
    const ip = request.ip;
    
    // Insert into metrics logs
    db.run(`INSERT INTO metrics (endpoint, method, response_time_ms) VALUES (?, ?, ?)`, 
      [request.routerPath || request.url, request.method, responseTime]);
    
    // Insert into logs
    db.run(`INSERT INTO logs (endpoint, method, user_id, ip, status_http) VALUES (?, ?, ?, ?, ?)`, 
      [request.routerPath || request.url, request.method, userId, ip, reply.statusCode]);
  });
  
  fastify.addHook('onError', async (request, reply, error) => {
      db.run(`INSERT INTO logs (endpoint, method, error_msg) VALUES (?, ?, ?)`, 
        [request.raw.url, request.method, error.message]);
  });

  // Auth Decorator to verify token
  fastify.decorate("authenticate", async function(request, reply) {
    try {
      if (request.url.startsWith('/auth')) return; // skip for login/register
      await request.jwtVerify()
    } catch (err) {
      reply.status(401).send({ statusCode: 401, intOpCode: 'SxGW401', data: null, message: "Unauthorized" });
    }
  });

  // Permission Check Hook Builder
  const requirePermission = (permission) => {
    return async (request, reply) => {
      const perms = request.user.permissions || [];
      // Note: fine-grained checking for specific group logic is left out of this global hook for simplicity,
      // it verifies if the user has the permission in ANY group (as parsed in user-service).
      if (!perms.includes(permission)) {
        return reply.status(403).send({ statusCode: 403, intOpCode: 'SxGW403', data: null, message: "Forbidden: Missing " + permission });
      }
    };
  };

  // We proxy with some hook checks
  // Auth routes (No auth required)
  fastify.register(proxy, {
    upstream: 'http://localhost:3001',
    prefix: '/auth',
    rewritePrefix: '/auth'
  });

  // Tickets routes
  // Add onRequest to append Headers
  fastify.register(proxy, {
    upstream: 'http://localhost:3002',
    prefix: '/tickets',
    rewritePrefix: '/tickets',
    preHandler: [fastify.authenticate],
    replyOptions: {
      rewriteRequestHeaders: (request, headers) => {
        return { ...headers, 'x-user-id': request.user?.userId };
      }
    }
  });

  // Groups and Users routes
  fastify.register(proxy, {
    upstream: 'http://localhost:3003',
    prefix: '/groups',
    rewritePrefix: '/groups',
    preHandler: [fastify.authenticate],
    replyOptions: {
      rewriteRequestHeaders: (request, headers) => {
        return { ...headers, 'x-user-id': request.user?.userId };
      }
    }
  });
  fastify.register(proxy, {
    upstream: 'http://localhost:3003',
    prefix: '/users',
    rewritePrefix: '/users',
    preHandler: [fastify.authenticate],
    replyOptions: {
      rewriteRequestHeaders: (request, headers) => {
        return { ...headers, 'x-user-id': request.user?.userId };
      }
    }
  });

  return fastify;
}

build().then(app => {
  app.listen({ port: 3000 }, (err, address) => {
    if (err) { app.log.error(err); process.exit(1); }
    console.log(`API Gateway listening at ${address}`);
  });
});
