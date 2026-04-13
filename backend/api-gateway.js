const fastify = require('fastify')({ logger: true });
const proxy = require('@fastify/http-proxy');
const cors = require('@fastify/cors');
const supabase = require('./db');

// CONFIGURACIÓN DE CORS
fastify.register(cors, {
  origin: true, 
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
});

// Registro de logs y métricas (CORREGIDO Y SEGURO)
fastify.addHook('onResponse', async (request, reply) => {
  const duration = reply.elapsedTime;
  const { method, url } = request;
  const statusCode = reply.statusCode;

  // No registramos peticiones internas o de salud
  if (url.includes('health')) return;

  try {
    // Guardar log
    await supabase.from('logs').insert([{ 
      method, path: url, status_code: statusCode, duration: `${duration.toFixed(2)}ms` 
    }]);

    // Actualizar métricas (Fijate en el Date corregido)
    const { data: metric } = await supabase.from('metrics').select('*').eq('endpoint', url).single();
    if (metric) {
      const newCount = metric.calls + 1;
      const newAvg = (metric.avg_duration * metric.calls + duration) / newCount;
      await supabase.from('metrics').update({ 
        calls: newCount, 
        avg_duration: newAvg, 
        last_call: new Date().toISOString() // Corregido
      }).eq('id', metric.id);
    } else {
      await supabase.from('metrics').insert([{ 
        endpoint: url, 
        avg_duration: duration,
        calls: 1,
        last_call: new Date().toISOString()
      }]);
    }
  } catch (e) {
    // Si falla el log, que no se caiga la app
    console.error('Metrics Error:', e.message);
  }
});

// --- PROXIES ---
fastify.register(proxy, { upstream: 'http://localhost:3001', prefix: '/auth', rewritePrefix: '/auth' });
fastify.register(proxy, { upstream: 'http://localhost:3002', prefix: '/tickets', rewritePrefix: '/tickets' });
fastify.register(proxy, { upstream: 'http://localhost:3003', prefix: '/groups', rewritePrefix: '/groups' });
fastify.register(proxy, { upstream: 'http://localhost:3003', prefix: '/users', rewritePrefix: '/users' });
fastify.register(proxy, { upstream: 'http://localhost:3003', prefix: '/students', rewritePrefix: '/students' });

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) { fastify.log.error(err); process.exit(1); }
  console.log(`API Gateway operational at ${address}`);
});
