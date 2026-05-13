// Punto de entrada del servidor
require('dotenv').config();

// Configurar zona horaria de Perú
process.env.TZ = 'America/Lima';

const app  = require('./app');
const port = parseInt(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log('================================================');
  console.log(' ROBERT GYM — Club Fitness | Backend API');
  console.log(`  Puerto:   ${port}`);
  console.log(`  Entorno:  ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Zona:     America/Lima (UTC-5)`);
  console.log('================================================');
});
