const { spawn } = require('child_process');
const path = require('path');

const services = [
  'api-gateway.js',
  'user-service.js',
  'tickets-service.js',
  'groups-service.js'
];

services.forEach(service => {
  const child = spawn('node', [path.join(__dirname, service)], { stdio: 'inherit' });
  child.on('close', code => {
    console.log(`${service} exited with code ${code}`);
  });
});
