const fastify = require('fastify')({ logger: true });
const proxy = require('@fastify/http-proxy');
const cors = require('@fastify/cors'); // Requerimos CORS
const supabase = require('./db');

// CONFIGURACIÓN DE CORS: Permite que Vercel hable con Render
fastify.register(cors, {
  origin: true, // En desarrollo/escuela podemos dejarlo en true para que acepte todo
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
});

// Registro de logs y métricas
fastify.addHook('onResponse', async (request, reply) => {
  const duration = reply.elapsedTime;
  const { method, url } = request;
  const statusCode = reply.statusCode;

  try {
    await supabase.from('logs').insert([{ 
      method, path: url, status_code: statusCode, duration: `${duration.toFixed(2)}ms` 
    }]);

    const { data: metric } = await supabase.from('metrics').select('*').eq('endpoint', url).single();
    if (metric) {
      const newCount = metric.calls + 1;
      const newAvg = (metric.avg_duration * metric.calls + duration) / newCount;
      await supabase.from('metrics').update({ calls: newCount, avg_duration: newAvg }).eq('id', metric.id);
    } else {
      await supabase.from('metrics').insert([{ endpoint: url, avg_duration: duration }]);
    }
  } catch (e) {
    fastify.log.error('Error in metrics hook:', e);
  }
});

// --- PROXIES A MICROSERVICIOS ---

fastify.register(proxy, {
  upstream: 'http://localhost:3001',
  prefix: '/auth',
  rewritePrefix: '/auth'
});

fastify.register(proxy, {
  upstream: 'http://localhost:3002',
  prefix: '/tickets',
  rewritePrefix: '/tickets'
});

fastify.register(proxy, {
  upstream: 'http://localhost:3003',
  prefix: '/groups',
  rewritePrefix: '/groups'
});

fastify.register(proxy, {
  upstream: 'http://localhost:3003',
  prefix: '/users',
  rewritePrefix: '/users'
});

fastify.register(proxy, {
  upstream: 'http://localhost:3003',
  prefix: '/students',
  rewritePrefix: '/students'
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`API Gateway listening at ${address}`);
});
