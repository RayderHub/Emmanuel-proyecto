const fastify = require('fastify')({ logger: true });
const proxy = require('@fastify/http-proxy');
const cors = require('@fastify/cors');
const supabase = require('./db');

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
});

// --- PROXIES DEFINITIVOS (SIN STRIP DE PREFIJO) ---
// Esto garantiza que si el frontend pide /auth/register, el microservicio recibe /auth/register

fastify.register(proxy, { upstream: 'http://localhost:3001', prefix: '/auth', rewritePrefix: '/auth' });
fastify.register(proxy, { upstream: 'http://localhost:3001', prefix: '/users', rewritePrefix: '/users' });
fastify.register(proxy, { upstream: 'http://localhost:3002', prefix: '/tickets', rewritePrefix: '/tickets' });
fastify.register(proxy, { upstream: 'http://localhost:3003', prefix: '/groups', rewritePrefix: '/groups' });
fastify.register(proxy, { upstream: 'http://localhost:3003', prefix: '/students', rewritePrefix: '/students' });

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) process.exit(1);
  console.log(`API Gateway operational at ${address}`);
});
