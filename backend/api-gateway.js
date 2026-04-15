const fastify = require('fastify')({ logger: true });
const proxy = require('@fastify/http-proxy');
const cors = require('@fastify/cors');
const supabase = require('./db');

fastify.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
});

// --- OPTIMIZACIÓN: LOGS EN SEGUNDO PLANO ---
// Eliminamos los 'await' para que la respuesta al usuario sea instantánea
fastify.addHook('onResponse', (request, reply) => {
  const duration = reply.elapsedTime;
  const { method, url } = request;
  const statusCode = reply.statusCode;

  if (url.includes('health') || url.includes('metrics')) return;

  // Ejecutamos esto SIN await para no frenar la navegación
  (async () => {
    try {
      // Registrar log (segundo plano)
      supabase.from('logs').insert([{ 
        method, path: url, status_code: statusCode, duration: `${duration.toFixed(2)}ms` 
      }]).then();

      // Actualizar métricas (segundo plano)
      const { data: metric } = await supabase.from('metrics').select('*').eq('endpoint', url).single();
      if (metric) {
        const newCount = metric.calls + 1;
        const newAvg = (metric.avg_duration * metric.calls + duration) / newCount;
        supabase.from('metrics').update({ 
          calls: newCount, 
          avg_duration: newAvg, 
          last_call: new Date().toISOString() 
        }).eq('id', metric.id).then();
      } else {
        supabase.from('metrics').insert([{ 
          endpoint: url, avg_duration: duration, calls: 1, last_call: new Date().toISOString()
        }]).then();
      }
    } catch (e) {
      // Silenciamos errores de métricas para no afectar al usuario
    }
  })();
});

// --- PROXIES DEFINITIVOS ---
fastify.register(proxy, { upstream: 'http://localhost:3001', prefix: '/auth',     rewritePrefix: '/auth' });

// ⚠️  El proxy específico /users/:id/groups DEBE ir ANTES del genérico /users
// porque Fastify resuelve los prefijos por orden de registro.
// GET /users/:userId/groups → groups-service (3003)
fastify.register(proxy, { upstream: 'http://localhost:3003', prefix: '/users/:userId/groups', rewritePrefix: '/users/:userId/groups' });

// Resto de /users → user-service (3001)
fastify.register(proxy, { upstream: 'http://localhost:3001', prefix: '/users',    rewritePrefix: '/users' });
fastify.register(proxy, { upstream: 'http://localhost:3002', prefix: '/tickets',  rewritePrefix: '/tickets' });
fastify.register(proxy, { upstream: 'http://localhost:3003', prefix: '/groups',   rewritePrefix: '/groups' });
fastify.register(proxy, { upstream: 'http://localhost:3003', prefix: '/students', rewritePrefix: '/students' });

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) process.exit(1);
  console.log(`API Gateway Operational`);
});
