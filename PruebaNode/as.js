/////Crear un post de pre_transacciones/inicializar////// en espera
app.post('/pre_transacciones/inicializar', async function (req, res,next) {

    var header_Application = req.header('Application');
    var header_IdOrganizacion = req.header('IdOrganizacion');
    var header_codigoEmpresa = req.header('codigoEmpresa');
    var header_tipoPreTransaccion = req.header('tipoPreTransaccion');


    var codEmpr = 0;
        oracledb.getConnection(connAttrs, function (err, connection) {
            if (err) {
                // Error connecting to DB
                messageErrorServer(res,err);
                return;
            }
            connection.execute("SELECT count(codigo_empresa) FROM latino_owner.daf_empresas WHERE codigo_empresa = 1 ;", {}, {
                outFormat: oracledb.OBJECT// Return the result as Object
            }, function (err, result) {
                if (err) {
                    messageErrorServer(res,err);
                } else {
                    codEmpr = result;
                    console.log(result);
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            messageErrorServer(res,err);
                            return;
                        }
                    });
            });
        });
    /*if(header_Application != null && header_IdOrganizacion != null && header_codigoEmpresa != null && header_tipoPreTransaccion != null){
        if (isNaN(header_codigoEmpresa)){
            messageErrorValidate(res);
            return;
        }
        var codEmpr = 0;
        oracledb.getConnection(connAttrs, function (err, connection) {
            if (err) {
                // Error connecting to DB
                messageErrorServer(res,err);
                return;
            }
            connection.execute("SELECT count(codigo_empresa) FROM latino_owner.daf_empresas WHERE cod_f ="+codEmpr+" ;", {}, {
                outFormat: oracledb.NUMBER // Return the result as Object
            }, function (err, result) {
                if (err) {
                    messageErrorServer(res,err);
                } else {
                    codEmpr = result;
                    console.log(result);
                }
                // Release the connection
                connection.release(
                    function (err) {
                        if (err) {
                            messageErrorServer(res,err);
                            return;
                        }
                    });
            });
        });
        if(){
            messageErrorValidate(res);
            return;
        } else{
            var secuenciaUser=req.body.secuenciaUsuario;
            var idTurno=req.body.idTurno;
            var idcaja=req.body.caja;
            var nemonicoCanalFacture = req.body.nemonicoCanalFacturacion;
            console.log(header_Application);
        }
    }else{
        messageErrorValidate(res);
        return;
    }*/
      /*oracledb.getConnection(connAttrs, function (err, connection) {
        if (err) {
            // Error de coneccion a DB
            res.set('Content-Type', 'application/json');
            res.status(500).send(JSON.stringify({
                status: 500,
                succes: false,
                message: "Ha ocurrido un error inesperado.",
                errorData: [err.message]
            }));
            return;
        }
        connection.execute("GRANT "+nomprivilege+"  TO   "+utilisateur, {}, {
            outFormat: oracledb.OBJECT // Return the result as Object
        }, function (err, result) {
            if (err) {
                res.set('Content-Type', 'application/json');
                res.status(400).send(JSON.stringify({
                status: 400,
                succes: false,
                message: "El campo no es valido",
                errorData: []
                }));
                return;
               
            } else {
                res.set('Content-Type', 'application/json');
                res.status(200).send(JSON.stringify({
                status: 0,
                succes: succes,
                message: "Su pre_transaccion fue inicializada",
                data:{
                    "idPretransaccion":0
                }
                }));
                return; 
                
            }
            // Release the connection
            connection.release(
                function (err) {
                    if (err) {
                        res.set('Content-Type', 'application/json');
                        res.status(500).send(JSON.stringify({
                            status: 500,
                            succes: false,
                            message: "Ha ocurrido un error inesperado.",
                            errorData: [err.message]
                        }));
                        return;
                    } else {
                        console.log("POST /sendTablespace : Connection released");
                    }
                });
        });
    });*/
   
});

try{

    connection = oracledb.getConnection(dbConfig);
    
    app.post('/pre_transacciones/inicializar', async function (req, res,next) {
    
        var header_Application = req.header('Application');
        var header_IdOrganizacion = req.header('IdOrganizacion');
        var header_codigoEmpresa = req.header('codigoEmpresa');
        var header_tipoPreTransaccion = req.header('tipoPreTransaccion');
    
    
        var codEmpr = await connection.execute("SELECT count(codigo_empresa) FROM latino_owner.daf_empresas WHERE codigo_empresa = :cod ;", {cod: header_codigoEmpresa}, {});
            console.log(codEmpr);   
        });  
    } catch(err){
        messageErrorServer(res,err);
        return;
    }finally {
        if (connection) {
          try {
            connection.close();
          } catch (err) {
            messageErrorServer(res,err);
          }
        }
    }