// backend/middleware/validarProducto.js
module.exports = (req, res, next) => {
    console.log('Middleware Validar Producto: Iniciado.');
    const { nombre, stock, precio, descripcion, fecha_vencimiento, proveedor_id } = req.body;
    console.log('Validar Producto: req.body recibido para validación:', req.body); // MUY IMPORTANTE

    // Validaciones para campos OBLIGATORIOS por la lógica de negocio (según tu DB son anulables,
    // pero un producto sin estos no tendría sentido práctico)
    if (!nombre || nombre.trim() === '') {
        console.log('Validar Producto: Nombre es obligatorio y no puede estar vacío.');
        return res.status(400).json({ error: 'El nombre del producto es obligatorio.' });
    }
    // Usamos Number() para asegurar que es un número y luego validamos
    if (stock === undefined || typeof stock !== 'number' || stock < 0) {
        console.log('Validar Producto: Stock inválido o faltante. Debe ser un número positivo.');
        return res.status(400).json({ error: 'El stock debe ser un número positivo y es obligatorio.' });
    }
    if (precio === undefined || typeof precio !== 'number' || precio < 0) {
        console.log('Validar Producto: Precio inválido o faltante. Debe ser un número positivo.');
        return res.status(400).json({ error: 'El precio debe ser un número positivo y es obligatorio.' });
    }

    // Validaciones para campos OPCIONALES (según tu DB)
    // Estos campos no son obligatorios, pero si se proporcionan, deben ser válidos.
    
    // Si la descripción se proporciona, debe ser una cadena (puede estar vacía si es opcional)
    if (descripcion !== undefined && descripcion !== null && typeof descripcion !== 'string') {
        console.log('Validar Producto: Descripción no es una cadena válida.');
        return res.status(400).json({ error: 'La descripción, si se proporciona, debe ser texto.' });
    }

    // Si se proporciona la fecha de vencimiento, debe ser una fecha válida
    if (fecha_vencimiento && isNaN(new Date(fecha_vencimiento).getTime())) {
        console.log('Validar Producto: Fecha de vencimiento inválida. Formato esperado YYYY-MM-DD.');
        return res.status(400).json({ error: 'La fecha de vencimiento, si se proporciona, debe ser una fecha válida.' });
    }

    // Si se proporciona el ID de proveedor, debe ser un número positivo
    if (proveedor_id !== undefined && proveedor_id !== null && (typeof proveedor_id !== 'number' || proveedor_id <= 0)) {
        console.log('Validar Producto: ID de proveedor inválido. Debe ser un número positivo.');
        return res.status(400).json({ error: 'El ID del proveedor, si se proporciona, debe ser un número positivo.' });
    }

    console.log('Middleware Validar Producto: Datos de producto válidos. Pasando a controlador.');
    next(); // Si todo es válido, pasa al siguiente middleware o controlador
};
