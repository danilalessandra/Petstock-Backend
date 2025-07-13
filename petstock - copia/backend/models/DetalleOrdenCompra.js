module.exports = (sequelize, DataTypes) => {
  const DetalleOrdenCompra = sequelize.define('DetalleOrdenCompra', {
    orden_compra_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'detalle_ordenes_compra',
    timestamps: false
  });

  return DetalleOrdenCompra;
};
