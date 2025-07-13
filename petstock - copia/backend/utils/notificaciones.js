// backend/utils/notificaciones.js
const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASS } = process.env;
const { Usuario } = require('../models');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

// Acepta 'io' como argumento
exports.enviarAlertaStock = async (producto, io) => { // <-- Agregado 'io' aquí
    try {
        const administradores = await Usuario.findAll({
            where: { rol: 'administrador' },
            attributes: ['email']
        });

        const correos = administradores.map(admin => admin.email).filter(Boolean);

        const asunto = `⚠️ Alerta de stock bajo: ${producto.nombre}`;
        const mensajeHtml = `
            <p>Hola,</p>
            <p>El producto <strong>${producto.nombre}</strong> tiene un stock actual de <strong>${producto.stock}</strong>, lo cual está por debajo del mínimo permitido (<strong>${producto.stock_minimo_sugerido}</strong>).</p>
            <p>Es recomendable gestionar reposición lo antes posible.</p>
        `;

        // Envío de correo electrónico (solo si hay destinatarios)
        if (correos.length > 0) {
            await transporter.sendMail({
                from: `"Sistema de PetStock" <${EMAIL_USER}>`,
                to: correos,
                subject: asunto,
                html: mensajeHtml
            });
            console.log(`📧 Alerta por correo enviada a administradores por producto: ${producto.nombre}`);
        } else {
            console.warn(`📧 No se enviaron correos para ${producto.nombre}, no hay administradores con email.`);
        }

        // --- EMITIR EVENTO SOCKET.IO ---
        if (io) { // Asegúrate de que 'io' fue pasado y es válido
            console.log(`🚀 Emitiendo evento 'stockAlert' para ${producto.nombre}`);
            io.emit('stockAlert', {
                message: `Stock bajo: ${producto.nombre} (${producto.stock} unidades). Mínimo sugerido: ${producto.stock_minimo_sugerido}.`,
                productId: producto.id,
                productName: producto.nombre,
                currentStock: producto.stock,
                suggestedMinStock: producto.stock_minimo_sugerido,
                type: 'stock_low',
                timestamp: new Date().toISOString()
            });
        } else {
            console.warn('Socket.io instance not available for stock alert. Notification will not be sent via WebSocket.');
        }

    } catch (error) {
        console.error('❌ Error al enviar alerta de stock (correo o socket):', error.message);
    }
};

exports.enviarAlertaVencimiento = async (producto, io) => { // También acepta 'io'
    try {
        const administradores = await Usuario.findAll({
            where: { rol: 'administrador' },
            attributes: ['email']
        });

        const correos = administradores.map(admin => admin.email).filter(Boolean);

        const asunto = `⏳ Producto por vencer: ${producto.nombre}`;
        const mensajeHtml = `
            <p>Hola,</p>
            <p>El producto <strong>${producto.nombre}</strong> tiene una fecha de vencimiento próxima: <strong>${producto.fecha_vencimiento}</strong>.</p>
            <p>Verifica y gestiona este producto para evitar pérdidas.</p>
        `;

        // Envío de correo
        if (correos.length > 0) {
            await transporter.sendMail({
                from: `"Sistema de PetStock" <${EMAIL_USER}>`,
                to: correos,
                subject: asunto,
                html: mensajeHtml
            });
            console.log(`📧 Alerta de vencimiento enviada por: ${producto.nombre}`);
        } else {
            console.warn(`📧 No se enviaron correos de vencimiento para ${producto.nombre}, no hay administradores con email.`);
        }

        // Emitir por socket para vencimiento también
        if (io) {
            console.log(`🚀 Emitiendo evento 'expirationAlert' para ${producto.nombre}`);
            io.emit('expirationAlert', {
                message: `Producto por vencer: ${producto.nombre}. Fecha de vencimiento: ${producto.fecha_vencimiento}.`,
                productId: producto.id,
                productName: producto.nombre,
                expirationDate: producto.fecha_vencimiento,
                type: 'expiration_warning',
                timestamp: new Date().toISOString()
            });
        } else {
            console.warn('Socket.io instance not available for expiration alert. Notification will not be sent via WebSocket.');
        }

    } catch (error) {
        console.error('❌ Error al enviar alerta de vencimiento (correo o socket):', error.message);
    }
};