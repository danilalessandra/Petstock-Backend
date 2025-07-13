const sequelize = require('../config/database'); // ✅ Instancia válida de Sequelize
const { Sequelize, DataTypes } = require('sequelize');

// Cargar modelos con patrón factory
const Producto = require('./Producto')(sequelize, DataTypes);
const Proveedor = require('./Proveedor')(sequelize, DataTypes);
const Usuario = require('./Usuario')(sequelize, DataTypes);
const Venta = require('./Venta')(sequelize, DataTypes);
const DetalleVenta = require('./DetalleVenta')(sequelize, DataTypes);
const OrdenCompra = require('./OrdenCompra')(sequelize, DataTypes);
const DetalleOrdenCompra = require('./DetalleOrdenCompra')(sequelize, DataTypes);
const MovimientoInventario = require('./MovimientoInventario')(sequelize, DataTypes);

// -------------------------
// Definición de Relaciones
// -------------------------

Proveedor.hasMany(Producto, { foreignKey: 'proveedor_id' });
Producto.belongsTo(Proveedor, { foreignKey: 'proveedor_id' });

Usuario.hasMany(Venta, { foreignKey: 'usuario_id' });
Venta.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });

Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'detalles' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' });

Producto.hasMany(DetalleVenta, { foreignKey: 'producto_id' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Proveedor.hasMany(OrdenCompra, { foreignKey: 'proveedor_id' });
OrdenCompra.belongsTo(Proveedor, { foreignKey: 'proveedor_id', as: 'proveedor' });

Producto.hasMany(DetalleOrdenCompra, { foreignKey: 'producto_id' });
DetalleOrdenCompra.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

OrdenCompra.hasMany(DetalleOrdenCompra, { foreignKey: 'orden_compra_id', as: 'detalles' });
DetalleOrdenCompra.belongsTo(OrdenCompra, { foreignKey: 'orden_compra_id' });

// Relaciones de MovimientoInventario con alias para incluir correctamente en consultas
Producto.hasMany(MovimientoInventario, { foreignKey: 'producto_id' });
MovimientoInventario.belongsTo(Producto, { foreignKey: 'producto_id', as: 'producto' });

Usuario.hasMany(MovimientoInventario, { foreignKey: 'usuario_id' });
MovimientoInventario.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// -------------------------
// Exportación
// -------------------------

module.exports = {
  sequelize,
  Sequelize,
  Producto,
  Proveedor,
  Usuario,
  Venta,
  DetalleVenta,
  OrdenCompra,
  DetalleOrdenCompra,
  MovimientoInventario
};
