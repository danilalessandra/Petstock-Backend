// backend/controllers/usuarioController.js

const { Usuario } = require('../models');
const bcrypt = require('bcryptjs'); // Importar bcryptjs para hashing

/**
 * Listar todos los usuarios.
 */
exports.getAll = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: { exclude: ['password'] } // Excluir la contraseña por seguridad
        });
        res.json(usuarios);
    } catch (error) {
        console.error('❌ Error al obtener usuarios (getAll):', error);
        res.status(500).json({ error: 'Error al obtener los usuarios.' });
    }
};

/**
 * Obtener un usuario por ID.
 */
exports.getById = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id, {
            attributes: { exclude: ['password'] } // Excluir la contraseña por seguridad
        });
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }
        res.json(usuario);
    } catch (error) {
        console.error('❌ Error al obtener usuario por ID:', error);
        res.status(500).json({ error: 'Error al obtener el usuario.' });
    }
};

/**
 * Crear un usuario nuevo.
 */
exports.create = async (req, res) => {
    try {
        // CAMBIO CLAVE: Usar 'password' en lugar de 'contraseña' para consistencia
        const { nombre, email, password, rol } = req.body; 

        if (!nombre || !email || !password || !rol) { // Validar todos los campos
            return res.status(400).json({ error: 'Faltan campos obligatorios (nombre, email, password, rol).' });
        }

        // Verificar si el email ya está registrado
        const existe = await Usuario.findOne({ where: { email } });
        if (existe) {
            return res.status(400).json({ error: 'El email ya está registrado.' });
        }

        // CAMBIO CLAVE: Hashear la contraseña antes de guardar
        const hashedPassword = await bcrypt.hash(password, 10);

        const nuevo = await Usuario.create({
            nombre,
            email,
            password: hashedPassword, // Guardar la contraseña hasheada
            rol
        });

        // Responder sin enviar la contraseña hasheada
        res.status(201).json({
            id: nuevo.id,
            nombre: nuevo.nombre,
            email: nuevo.email,
            rol: nuevo.rol
        });
    } catch (error) {
        console.error('❌ Error al crear usuario:', error);
        // Mejorar el mensaje de error para validaciones de Sequelize
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ 
                error: 'Error de validación al crear el usuario.', 
                details: error.errors.map(e => e.message).join(', ') 
            });
        }
        res.status(500).json({ error: 'Error al crear el usuario.', details: error.message });
    }
};

/**
 * Actualizar un usuario existente.
 */
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        // CAMBIO CLAVE: Extraer 'password' explícitamente del body
        const { nombre, email, password, rol } = req.body; 

        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        // Crear un objeto con los campos a actualizar
        const updateFields = { nombre, email, rol };

        // CAMBIO CLAVE: Hashear la nueva contraseña SOLO si se proporciona
        if (password) { 
            updateFields.password = await bcrypt.hash(password, 10);
        }

        // Actualizar el usuario con los campos preparados
        await usuario.update(updateFields); 
        
        // Responder con los datos actualizados del usuario, excluyendo la contraseña
        res.json({
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol
        });
    } catch (error) {
        console.error('❌ Error al actualizar usuario:', error);
        // Mejorar el mensaje de error para validaciones de Sequelize
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ 
                error: 'Error de validación al actualizar el usuario.', 
                details: error.errors.map(e => e.message).join(', ') 
            });
        }
        res.status(500).json({ error: 'Error al actualizar el usuario.', details: error.message });
    }
};

/**
 * Eliminar un usuario.
 */
exports.delete = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.params.id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        await usuario.destroy();
        res.json({ message: 'Usuario eliminado correctamente.' });
    } catch (error) {
        console.error('❌ Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar el usuario.' });
    }
};