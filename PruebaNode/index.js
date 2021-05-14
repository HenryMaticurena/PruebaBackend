var express = require("express");
const dbConfig = require('./dbconfig.js');
var app = express();
var router = express.Router();
var bodyparser=require('body-parser');
var oracledb = require('oracledb');
//Authorisar requerimiento cors
var cors = require('cors');
const { autoCommit } = require("oracledb");
app.use(cors());

app.use(express.json());

///Cambiar el formato al requerimiento bodyparser 
app.use(express.urlencoded({
    extended: true
}));

let connection;

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

function messageErrorValidate(respuesta,mensaje) {
    respuesta.set('Content-Type', 'application/json');
    respuesta.status(400).send(JSON.stringify({
    code: 400,
    success: false,
    message: "El campo "+ mensaje+"no es valido",
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
async function releaseConection(connection,respuesta) {
    if (connection) {
        try {
          await connection.close();
        } catch (err) {
            messageErrorServer(respuesta,err);
            return;
        }
      }

    }


var resultado;
/////Crear un post de pre_transacciones/inicializar////// en espera
app.post('/pre_transacciones/inicializar', async function (req, res,next) {
    'use strict';
    //EXTRAIGO LOS HEADERS REQUERIDOS
    var header_Application = req.header('Application');
    var header_IdOrganizacion = req.header('IdOrganizacion');
    var header_codigoEmpresa = req.header('codigoEmpresa');
    var header_tipoPreTransaccion = req.header('tipoPreTransaccion');

    //ACCEDO AL POST SOLO SI LOS HEADERS EXISTEN
    if(header_Application != null && header_IdOrganizacion != null && header_codigoEmpresa != null && header_tipoPreTransaccion != null){
        //Valido que codigo_empresa sea un numero
        if (isNaN(header_codigoEmpresa)){
            messageErrorValidate(res,"codigoEmpresa");
            return;
        }
        //Valido que tipoPreTransaccion sea "FACTURA O COTIZACION"
        if("FACTURA" != header_tipoPreTransaccion.toUpperCase() && "COTIZACION"!= header_tipoPreTransaccion.toUpperCase()){
            messageErrorValidate(res,"tipoPreTransaccion");
            return;
        }
        //VALIDO QUE LA APPLICATION SOLO CONTENGA ESTE VALOR
        if("UEhBTlRPTVhfV0VC"!= header_Application){
            messageErrorValidate(res,"Application");
            return
        }
        
        try {
            connection = await oracledb.getConnection(dbConfig);

        } catch (error) {
            messageErrorServer(res,error);
                return;
        }

        try {
            connection = await oracledb.getConnection(dbConfig);
            //Valido que el codigo_empresa exista en la db
            resultado =  await connection.execute("SELECT count(codigo_empresa) FROM latino_owner.daf_empresas WHERE codigo_empresa = :code", {code: header_codigoEmpresa});
            if(resultado.rows[0][0] === 0){
                messageErrorValidate(res,"codigoEmpresa");
                return;
            }
        } catch (error) {
            messageErrorServer(res,error);
            return;
        }finally{
            releaseConection(connection,res);
        }

        //Guardo los valores del body a usar
        var secuenciaUser= await req.body.secuenciaUsuario;
        var idTurno=req.body.idTurno;
        var idcaja=req.body.caja;
        var nemonicoCanalFacture = req.body.nemonicoCanalFacturacion;
        console.log(secuenciaUser);

        //Valido que la nemonicoCanalFacture exista
        if("CAJA" != nemonicoCanalFacture.toUpperCase()){
            messageErrorValidate(res,"nemonicoCanalFactura");
            return;
        }

        //Valido que la Secuencia de usuario exista
        try {
            connection = await oracledb.getConnection(dbConfig);
            resultado = await connection.execute("SELECT count(SECUENCIA_USUARIO) FROM latino_owner.dafx_usuarios_sistema WHERE SECUENCIA_USUARIO = :code", {code: secuenciaUser})
            if(resultado.rows[0][0] === 0){
                messageErrorValidate(res,"SecuenciaUsuario");
                return;
            }
        } catch (error) {
            messageErrorServer(res,error);
            return;
        }finally{
            releaseConection(connection,res);
        }


        try {
            connection = await oracledb.getConnection(dbConfig);
            resultado = await connection.execute("SELECT count(CODIGO_SUCURSAL) FROM latino_owner.daf_sucursales WHERE CODIGO_SUCURSAL = :code", {code: idcaja['codigoSucursal']})
            if(resultado.rows[0][0] === 0){
                messageErrorValidate(res,"codigoSucursal");
                return;
            }
        } catch (error) {
            messageErrorServer(res,error);
            return;
        }finally{
            releaseConection(connection,res);
        }

        try {
            connection = await oracledb.getConnection(dbConfig);
            resultado = await connection.execute("SELECT MAX(CODIGO_PRE_TRANSACCION) FROM latino_owner.fac_pre_transacciones", {});
            var idpretr=resultado.rows[0][0]+1;
            console.log(resultado);

           
            
            var result2 = await connection.execute("SELECT CODIGO_USUARIO FROM latino_owner.dafx_usuarios_sistema WHERE SECUENCIA_USUARIO = :codes", {codes: secuenciaUser});
            var codUser=result2.rows[0][0];
            console.log(codUser);
           

           
            var resultadofinal = await connection.execute("Insert into latino_owner.fac_pre_transacciones values (:codPreTransac,:codEmpre,:codSucur,:codCaja,:NumerPun,"
            +":SecuenUs,:codUsuario,null,:TipoPretr,1,'S',:SecuenUsuarioIngreso,:UsuarioIngreso,SYSDATE,null,null,null)",  {
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
            });
            // Sentencia me da error porque violo los permisos que tengo anexados connection.commit();
            console.log("llega hasta aca");
            
            messageSuccess(res,idpretr);

        } catch (error) {
            messageErrorServer(res,error);
            return;
        } finally{
            // Release the connection
            releaseConection(connection,res);
        }

    }else {
        messageErrorValidate(res,"application o idOrganization o codigoEmpresa o TipoTransaccion");
        return;
    }
    
   
});





app.listen(3000,function(){
    console.log("Live at Port 3000");
});