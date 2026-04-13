const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const fastifyJwt = require('@fastify/jwt');
const rateLimit = require('@fastify/rate-limit');
const proxy = require('@fastify/http-proxy');
const supabase = require('./db');

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
    supabase.from('metrics').insert([{ 
      endpoint: request.routerPath || request.url, 
      method: request.method, 
      response_time_ms: responseTime 
    }]).then();
    
    // Insert into logs
    supabase.from('logs').insert([{ 
      endpoint: request.routerPath || request.url, 
      method: request.method, 
      user_id: userId, 
      ip: ip, 
      status_http: reply.statusCode 
    }]).then();
  });
  
  fastify.addHook('onError', async (request, reply, error) => {
      supabase.from('logs').insert([{ 
        endpoint: request.raw.url, 
        method: request.method, 
        error_msg: error.message 
      }]).then();
  });

  // Auth Decorator to verify token
  fastify.decorate("authenticate", async function(request, reply) {
    try {
      if (request.url.startsWith('/auth')) return; 
      await request.jwtVerify()
    } catch (err) {
      reply.status(401).send({ statusCode: 401, intOpCode: 'SxGW401', data: null, message: "Unauthorized" });
    }
  });

  // Proxy routes
  fastify.register(proxy, {
    upstream: 'http://localhost:3001',
    prefix: '/auth',
    rewritePrefix: '/auth'
  });

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
  const port = process.env.PORT || 3000;
  app.listen({ port: port, host: '0.0.0.0' }, (err, address) => {
    if (err) { app.log.error(err); process.exit(1); }
    console.log(`API Gateway listening at ${address}`);
  });
});
