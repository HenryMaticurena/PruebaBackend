var express = require("express");
const dbConfig = require('./dbconfig.js');
var app = express();
var router = express.Router();
var bodyparser=require('body-parser');
var oracledb = require('oracledb');
//Authorisar requerimiento cors
var cors = require('cors');
app.use(cors());

app.use(express.json());

///Cambiar el formato al requerimiento bodyparser 
app.use(express.urlencoded({
    extended: true
}));

function messageSuccess(respuesta,valor) {
    respuesta.set('Content-Type', 'application/json');
    respuesta.status(200).send(JSON.stringify({
        code: 0,
        success: true,
        message: "La pre_transaccion se ha realizado",
        data: {
            idPreTransaccion: valor
        }
    }));
}

function messageErrorValidate(respuesta ) {
    respuesta.set('Content-Type', 'application/json');
    respuesta.status(400).send(JSON.stringify({
    code: 400,
    success: false,
    message: "El campo no es valido",
    errorData: []
    }));
}

function messageErrorServer(respuesta,errorcod) {
    respuesta.set('Content-Type', 'application/json');
    respuesta.status(500).send(JSON.stringify({
    code: 500,
    success: false,
    message: "Ha ocurrido un error inesperado.",
    errorData: [errorcod.message]
    }));
}

    // Release the connection
    function releaseConection(connection,respuesta) {
        connection.release(
            function (err) {
                if (err) {
                    messageErrorServer(respuesta,err);
                    return;
                }
            });
    }


/////Crear un post de pre_transacciones/inicializar////// en espera
app.post('/pre_transacciones/inicializar', async function (req, res,next) {
    //EXTRAIGO LOS HEADERS REQUERIDOS
    var header_Application = req.header('Application');
    var header_IdOrganizacion = req.header('IdOrganizacion');
    var header_codigoEmpresa = req.header('codigoEmpresa');
    var header_tipoPreTransaccion = req.header('tipoPreTransaccion');

    //ACCEDO AL POST SOLO SI LOS HEADERS EXISTEN
    if(header_Application != null && header_IdOrganizacion != null && header_codigoEmpresa != null && header_tipoPreTransaccion != null){
        //Valido que codigo_empresa sea un numero
        if (isNaN(header_codigoEmpresa)){
            messageErrorValidate(res);
            return;
        }
        //Valido que tipoPreTransaccion sea "FACTURA O COTIZACION"
        if("FACTURA" != header_tipoPreTransaccion.toUpperCase() && "COTIZACION"!= header_tipoPreTransaccion.toUpperCase()){
            messageErrorValidate(res);
            return;
        }
        //VALIDO QUE LA APPLICATION SOLO CONTENGA ESTE VALOR
        if("UEhBTlRPTVhfV0VC"!= header_Application){
            messageErrorValidate(res);
            return
        }
        
        await oracledb.getConnection(dbConfig, async function (err, connection) {
            if (err) {
                messageErrorServer(res,err);
                return;
            }
            //Valido que el codigo_empresa exista en la db
            await connection.execute("SELECT count(codigo_empresa) FROM latino_owner.daf_empresas WHERE codigo_empresa = :code", {code: header_codigoEmpresa}, function (err, result) {
                if (err) {
                    messageErrorServer(res,err);
                    return;
                } else {
                    if(result.rows[0][0] === 0){
                        messageErrorValidate(res);
                        return;
                    }
                    
                }
                // Release the connection
                releaseConection(connection,res);
            });

            //Guardo los valores del body a usar
            var secuenciaUser= await req.body.secuenciaUsuario;
            var idTurno=req.body.idTurno;
            var idcaja=req.body.caja;
            var nemonicoCanalFacture = req.body.nemonicoCanalFacturacion;
            
             //Valido que la nemonicoCanalFacture exista
            if("FACTURA" != nemonicoCanalFacture.toUpperCase() && "COTIZACION"!= nemonicoCanalFacture.toUpperCase()){
                messageErrorValidate(res);
                return;
            }
            //Valido que la Secuencia de usuario exista
            
            await connection.execute("SELECT count(SECUENCIA_USUARIO) FROM latino_owner.dafx_usuarios_sistema WHERE SECUENCIA_USUARIO = :code", {code: secuenciaUser}, function (err, result) {
                if (err) {
                    messageErrorServer(res,err);
                    return;
                } else {
                    if(result.rows[0][0] === 0){
                        messageErrorValidate(res);
                        return;
                    }
                    
                }
                // Release the connection
                releaseConection(connection,res);
            });

            await connection.execute("SELECT max(codigo_pre_transaccion) FROM latino_owner.fac_pre_transacciones", {}, async function (err, result) {
                if (err) {
                    messageErrorServer(res,err);
                } else {
                    var idpretr=result.rows[0][0]+1;
                    
                    await connection.execute("SELECT CODIGO_USUARIO FROM latino_owner.dafx_usuarios_sistema WHERE SECUENCIA_USUARIO = :codes", {codes: secuenciaUser}, async function (err, result) {
                        if (err) {
                            messageErrorServer(res,err);
                        } else {
                            var codUser = result.rows[0][0];
                            console.log(result);
                            await connection.execute("Insert into latino_owner.fac_pre_transacciones values (:codPreTransac,:codEmpre,:codSucur,:codCaja,:NumerPun,"
                            +":SecuenUs,:codUsuario,:TipoPretr,'S',:SecuenUsuarioIngreso,:UsuarioIngreso,SYSDATE,null,null,null)", {
                                codPreTransac:idpretr,
                                codEmpre:header_codigoEmpresa.toString(),
                                codSucur:idcaja['codigoSucursal'],
                                codCaja:idcaja['codigoCaja'],
                                NumerPun:idcaja['numeroPuntoEmision'],
                                SecuenUs:secuenciaUser,
                                codUsuario:codUser,
                                TipoPretr:nemonicoCanalFacture,
                                SecuenUsuarioIngreso:secuenciaUser,
                                UsuarioIngreso:codUser,
                            }, function (err, result) {
                            if (err) {
                        
                                messageErrorServer(res,err);
                                return;
                            } else {
                                messageSuccess(res,idpretr);
                            }
                        // Release the connection
                             releaseConection(connection,res);
                            });
                            
                        }
                        // Release the connection
                        releaseConection(connection,res);
                    });
                    
                    
                }
                // Release the connection
                releaseConection(connection,res);
            });
            

        });

    }else {
        messageErrorValidate(res);
        return;
    }
    
   
});





app.listen(3000,function(){
    console.log("Live at Port 3000");
});