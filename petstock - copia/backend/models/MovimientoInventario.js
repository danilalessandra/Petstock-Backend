// backend/models/MovimientoInventario.js
module.exports = (sequelize, DataTypes) => {
  const MovimientoInventario = sequelize.define('MovimientoInventario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    producto_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('entrada', 'salida'),
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    motivo: { // <<< ESTE ES EL CAMPO QUE NECESITAS AÑADIR
      type: DataTypes.STRING, // Puedes usar DataTypes.TEXT si esperas descripciones más largas
      allowNull: true // Esto permite que el campo sea opcional. Cámbialo a false si el motivo es siempre obligatorio.
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'movimientos_inventario',
    timestamps: true
  });


  return MovimientoInventario;
};