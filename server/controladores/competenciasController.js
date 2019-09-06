var conexionBaseDeDatos = require('../lib/conexionbd');

function obtenerCompetencia(req, res) {
  var id = req.params.id;
  var peticionSql = 'SELECT * FROM competencia WHERE id = ?';
  
  conexionBaseDeDatos.query(peticionSql, [id], function(error, resultado, campos) {
    if(error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    };
    if(!id) {
      console.log('La competencia no existe.');
      return res.status(404).send('La competencia no existe.');
    };
    console.log(resultado[0])
    res.send(JSON.stringify(resultado[0]));
  })
}


// Cargamos las competencias
function cargarCompetencia(req, res) {
  var peticionSql = 'SELECT * FROM competencia';
  
  conexionBaseDeDatos.query(peticionSql, function(error, resultado, campos) {
    if(error) {
      console.log('No se encuentra ninguna competencia en el servidor.', error.message);
      return res.status(500).send('No se encuentra ninguna competencia en el servidor.');
    };
    res.send(JSON.stringify(resultado));
  })
}

module.exports = {
	cargarCompetencia : cargarCompetencia,
	obtenerCompetencia : obtenerCompetencia,
};