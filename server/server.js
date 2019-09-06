var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var controlador = require('./controladores/competenciasController');

var app = express();

app.use(cors());

app.use(bodyParser.urlencoded({
  extended: true,
}));

app.use(bodyParser.json());
app.get('/competencias/:id', controlador.obtenerCompetencia);
app.get('/competencias', controlador.cargarCompetencia);
//seteamos el puerto en el cual va a escuchar los pedidos la aplicación
var puerto = '8080';

app.listen(puerto, function () {
  console.log( "Escuchando en el puerto " + puerto );
});