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
app.get('/competencias/:id/peliculas',controlador.obtenerOpciones);
app.post('/competencias/:id/voto', controlador.votar);
app.get('/competencias/:id/resultados', controlador.obtenerResultados);
app.get("/generos", controlador.cargarGeneros);
app.get("/directores", controlador.cargarDirectores);
app.get("/actores", controlador.cargarActores);
app.post('/competencias', controlador.crearCompetencia);
app.delete('/competencias/:id/votos', controlador.eliminarVotos);
app.delete("/competencias/:id", controlador.eliminarCompetencia);
app.put("/competencias/:id", controlador.editarCompetencia);


//seteamos el puerto en el cual va a escuchar los pedidos la aplicación
var puerto = '8080';

app.listen(puerto, function () {
  console.log( "Escuchando en el puerto " + puerto );
});