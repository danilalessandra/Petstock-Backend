require('dotenv').config(); // Asegúrate de que esto esté al principio para cargar las variables de .env
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT, // Asegúrate de leer el puerto de las variables de entorno
        dialect: 'postgres',
        logging: console.log,
        dialectOptions: {
            ssl: {
                require: true, // Esto fuerza el uso de SSL
                rejectUnauthorized: false // Esto es crucial para Render si no tienes un certificado CA específico
                // En un entorno de producción con certificados CA confiables, esto debería ser true.
                // Para Render y desarrollo, false suele ser necesario para evitar errores de certificado.
            }
        },
        // Si tu aplicación usa la variable DATABASE_URL completa, puedes usar esto en su lugar:
        // connectionString: process.env.DATABASE_URL,
        // dialectOptions: {
        //     ssl: {
        //         require: true,
        //         rejectUnauthorized: false
        //     }
        // }
    }
);

module.exports = sequelize;
