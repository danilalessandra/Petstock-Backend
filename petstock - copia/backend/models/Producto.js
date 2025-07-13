// backend/models/Producto.js
module.exports = (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: DataTypes.STRING(100),
    descripcion: DataTypes.TEXT,
    stock: DataTypes.INTEGER, // stock_actual
    precio: DataTypes.DECIMAL(10, 2),
    fecha_vencimiento: DataTypes.DATEONLY,
    proveedor_id: DataTypes.INTEGER,

    // NUEVOS CAMPOS A AÑADIR/MODIFICAR:
    dias_transito_proveedor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 7
    },
    factor_seguridad_stock: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true,
      defaultValue: 1.20
    },
    stock_minimo_sugerido: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    }
    // FIN DE LOS NUEVOS CAMPOS
  }, {
    tableName: 'productos',
    timestamps: true
  });

  return Producto;
};