// Configuración de conexión a PostgreSQL
const { Pool } = require('pg');

// DB_SSL_STRICT=true exige certificado válido del servidor (recomendado en producción
// si el proveedor lo soporta); por defecto se mantiene el modo permisivo actual
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: process.env.DB_SSL_STRICT === 'true' },
    })
  : new Pool({
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
