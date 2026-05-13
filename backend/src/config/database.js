// Configuración de conexión a PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'robertgym',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.message);
    return;
  }
  release();
  console.log('Conectado a PostgreSQL correctamente');
});

module.exports = pool;
