// backend/cronJobs/checkExpirations.js
const cron = require('node-cron');
const { Producto } = require('../models');
const { enviarAlertaVencimiento } = require('../utils/notificaciones');
const { Op } = require('sequelize'); // Necesario para operadores de Sequelize

// Función para verificar productos por vencer
const checkExpirationDates = async (io) => { // <-- Recibe 'io'
    console.log('--- Iniciando verificación de productos por vencer ---'); // Log al inicio de la ejecución
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30); // Productos que vencen en los próximos 30 días

    try {
        const productsExpiringSoon = await Producto.findAll({
            where: {
                fecha_vencimiento: {
                    [Op.not]: null, // Asegura que la fecha de vencimiento no sea nula
                    [Op.lte]: thirtyDaysFromNow, // La fecha de vencimiento es hoy o en los próximos 30 días
                    [Op.gte]: today // La fecha de vencimiento no ha pasado aún (hoy o futuro)
                },
                // Opcional: Podrías añadir un campo `notificado_vencimiento` para evitar duplicados
                // o lógica para solo notificar una vez al alcanzar cierto umbral de días.
            }
        });

        if (productsExpiringSoon.length > 0) {
            console.log(`⏰ Se encontraron ${productsExpiringSoon.length} productos por vencer.`);
            for (const producto of productsExpiringSoon) {
                await enviarAlertaVencimiento(producto, io); // Pasa 'io' aquí
            }
        } else {
            console.log('⏰ No se encontraron productos por vencer en los próximos 30 días.');
        }
    } catch (error) {
        console.error('❌ Error al verificar fechas de vencimiento:', error);
    } finally {
        console.log('--- Verificación de productos por vencer finalizada ---'); // Log al final de la ejecución
    }
};

// Exporta la función para programar el cron
exports.scheduleExpirationChecks = (io) => { // <-- Acepta 'io'
    // Se ejecuta todos los días a la 01:00 AM (hora del servidor donde se ejecuta el backend)
    cron.schedule('0 1 * * *', () => { // '0 1 * * *' significa: a la 01:00 de cada día
        console.log('Running daily expiration check via cron job...');
        checkExpirationDates(io); // Pasa 'io' al checker
    });
    console.log('⏰ Tarea de verificación de vencimiento programada para todos los días a la 01:00 AM (hora del servidor).');

    // Puedes ejecutarla una vez al inicio también para un chequeo inmediato al arrancar el servidor.
    // Esto es útil para probar la funcionalidad o para asegurar que no se pierdan notificaciones
    // si el servidor estuvo apagado durante la hora programada del cron.
    // checkExpirationDates(io);
};