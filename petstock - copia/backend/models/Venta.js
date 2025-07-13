module.exports = (sequelize, DataTypes) => {
  const Venta = sequelize.define('Venta', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'ventas',
    timestamps: true
  });

  return Venta;
};
