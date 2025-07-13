module.exports = (sequelize, DataTypes) => {
  const Proveedor = sequelize.define('Proveedor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    contacto: DataTypes.STRING(100),
    direccion: DataTypes.STRING(150)
  }, {
    tableName: 'proveedores',
    timestamps: true
  });

  return Proveedor;
};
