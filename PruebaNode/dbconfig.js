//Credenciales de Base de datos
module.exports = {
    user          : process.env.NODE_ORACLEDB_USER || "HENRY.MATICURENA",
    password      : process.env.NODE_ORACLEDB_PASSWORD || "henry123",
    connectString : process.env.NODE_ORACLEDB_CONNECTIONSTRING || "52.7.160.244:2112/PRODUCCION"
  };