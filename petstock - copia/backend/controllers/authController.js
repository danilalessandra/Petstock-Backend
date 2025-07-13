// backend/controllers/authController.js
const { Usuario } = require('../models'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Asegúrate de tener estas variables de entorno en tu archivo .env
// JWT_SECRET=tu_secreto_para_access_token
// REFRESH_TOKEN_SECRET=tu_secreto_para_refresh_token_mas_largo

exports.login = async (req, res) => {
    const { email, password } = req.body;

    console.log('--- INTENTO DE LOGIN ---');
    console.log('Email recibido (frontend):', email); 
    console.log('Contraseña recibida (frontend, texto plano):', password); 

    try {
        const usuario = await Usuario.findOne({ where: { email } });

        if (!usuario) {
            console.log('Resultado de búsqueda de usuario:', 'NO ENCONTRADO para email:', email);
            return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        console.log('Usuario encontrado en DB (nombre):', usuario.nombre);
        console.log('Contraseña HASHED en DB para este usuario:', usuario.password); 

        const passwordValido = await bcrypt.compare(password, usuario.password);

        if (!passwordValido) {
            console.log('Resultado de bcrypt.compare:', 'FALSA - La contraseña no coincide.');
            return res.status(400).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        console.log('Resultado de bcrypt.compare:', 'VERDADERA - Contraseña válida.');
        console.log('Contraseña válida. Generando tokens...'); // <-- LOG AÑADIDO

        const payload = {
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        };

        // 1. Generar Access Token (vida corta, ej. 8 horas)
        const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
        console.log('Access Token generado.'); // <-- LOG AÑADIDO

        // 2. Generar Refresh Token (vida más larga, ej. 7 días)
        const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
        console.log('Refresh Token generado.'); // <-- LOG AÑADIDO

        // 3. Guardar el Refresh Token en la base de datos del usuario
        // Asegúrate de que tu modelo Usuario tenga un campo 'refreshToken' (DataTypes.STRING)
        usuario.refreshToken = refreshToken; 
        await usuario.save(); 
        console.log('Refresh Token guardado en DB.'); // <-- LOG AÑADIDO
        
        // 4. Enviar Refresh Token como cookie HTTP-only
        // 'jwt' es el nombre de la cookie que tu frontend espera
        res.cookie('jwt', refreshToken, {
            httpOnly: true, // No accesible por JavaScript en el navegador (más seguro)
            secure: process.env.NODE_ENV === 'production', // Solo si estás en producción (HTTPS)
            sameSite: 'Strict', // Protección contra CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000 // Duración de la cookie (7 días en milisegundos)
        });
        console.log('Cookie JWT enviada.'); // <-- LOG AÑADIDO

        // 5. Responder con el Access Token (para que el frontend lo guarde en localStorage)
        res.json({
            accessToken, 
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
        console.log('Respuesta JSON final enviada al frontend.'); // <-- LOG AÑADIDO

    } catch (error) {
        console.error('Error CATASTRÓFICO en el servidor durante el login (catch):', error); 
        res.status(500).json({ error: 'Error en el servidor.' });
    }
};

// NUEVA FUNCIÓN: Manejar el refresco del token
exports.refreshToken = async (req, res) => {
    // El refresh token debería venir en una cookie llamada 'jwt'
    const cookies = req.cookies;
    if (!cookies?.jwt) { // Si no hay cookie 'jwt'
        console.log('--- INTENTO DE REFRESH TOKEN ---');
        console.log('No hay refresh token en cookies.');
        return res.status(401).json({ message: 'No autorizado: No se encontró refresh token.' }); 
    }

    const refreshToken = cookies.jwt;
    console.log('--- INTENTO DE REFRESH TOKEN ---');
    console.log('Refresh Token recibido en backend (de cookie):', refreshToken);

    try {
        // Buscar al usuario que tiene este refresh token en la base de datos
        const usuario = await Usuario.findOne({ where: { refreshToken } }); 

        if (!usuario) {
            console.log('Usuario no encontrado para este refresh token en DB. Posible token inválido o revocado.');
            // Si el refresh token no está asociado a ningún usuario (ej. ya se usó o fue revocado)
            res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
            return res.status(403).json({ message: 'Prohibido: Token de refresco no válido o usuario no encontrado.' });
        }
        console.log('Usuario encontrado en DB para refresh token (ID):', usuario.id);


        // Verificar el refresh token
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => { // Usar async aquí para await usuario.save() si rotas el token
                if (err || decoded.id !== usuario.id) {
                    console.log('Fallo la verificación del refresh token:', err);
                    res.clearCookie('jwt', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict' });
                    return res.status(403).json({ message: 'Prohibido: Token de refresco inválido o expirado.' });
                }
                console.log('Refresh token verificado correctamente. ID decodificado:', decoded.id);

                // Generar un nuevo Access Token
                const payload = {
                    id: usuario.id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    rol: usuario.rol
                };
                const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
                console.log('Nuevo Access Token generado.');

                // Opcional pero recomendado: Rotar el refresh token (generar uno nuevo y reemplazarlo en DB)
                // Esto mejora la seguridad al invalidar tokens antiguos después de un uso.
                // Si decides implementarlo, asegúrate de enviar la nueva cookie 'jwt' al frontend también.
                /*
                const newRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
                usuario.refreshToken = newRefreshToken;
                await usuario.save(); // Guardar el nuevo refresh token en la DB
                res.cookie('jwt', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
                console.log('Refresh Token rotado y nueva cookie JWT enviada.');
                */

                res.json({ accessToken: newAccessToken });
                console.log('Respuesta JSON con nuevo Access Token enviada al frontend.');
            }
        );

    } catch (error) {
        console.error('Error CATASTRÓFICO al refrescar token (catch):', error);
        res.status(500).json({ error: 'Error interno del servidor al refrescar token.' });
    }
};

exports.register = async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    try {
        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ error: 'El email ya está registrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const usuario = await Usuario.create({
            nombre,
            email,
            password: hashedPassword,
            rol
        });

        res.status(201).json({
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error al registrar usuario.' });
    }
};