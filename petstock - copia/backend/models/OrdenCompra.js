module.exports = (sequelize, DataTypes) => {
  const OrdenCompra = sequelize.define('OrdenCompra', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    proveedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    estado: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    tableName: 'ordenes_compra',
    timestamps: true
  });

  return OrdenCompra;
};
