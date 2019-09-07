var conexionBaseDeDatos = require('../lib/conexionbd');
var fs  = require("fs");

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
// Creamos una funcion universal que nos permite buscar peliculas
// de acuerdo a los parametros enviados
function sqlBuscarPeliculas(genero, director, actor) {
  var sqlJoin = function() {
    var sql = '';
    if(director > 0) {
      sql += ` JOIN director_pelicula ON pelicula.id = director_pelicula.pelicula_id
               JOIN director ON director_pelicula.director_id = director.id`
    }
    if(actor > 0) {
      sql += ` JOIN actor_pelicula ON pelicula.id = actor_pelicula.pelicula_id
               JOIN actor ON actor_pelicula.actor_id = actor.id`
    }
    return sql;
  }

  var sqlFiltros = function() {
    var sql = '';
    if((genero + director + actor) > 0) {
      sql += ' WHERE ';
    }
    if(genero > 0) {
      sql += 'genero_id = ' + genero;
    }
    if(genero > 0 && (director > 0 || actor > 0)) {
      sql += ' AND ';
    }
    if(director > 0) {
      sql += 'director.id = ' + director;
    }
    if(director > 0 && actor > 0) {
      sql += ' AND ';
    }
    if(actor > 0) {
      sql += 'actor.id = ' + actor;
    }
    return sql;
  }

  var sql = 'SELECT pelicula.* FROM pelicula' + sqlJoin() + sqlFiltros() + ' ORDER BY RAND() LIMIT 2';
  return sql;
}

function obtenerOpciones(req, res){
  var respuesta = {};
  var id = req.params.id;
  var peticionSql = 'SELECT * FROM competencia WHERE competencia.id = ' + id;
  conexionBaseDeDatos.query(peticionSql, function(error, resultado, campos) {
    if(error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    }
    if(resultado.length <= 0) {
      console.log('La competencia no existe');
      return res.status(404).send('La competencia no existe');
    }

    // Creamos el objeto respuesta
    respuesta = {
      competencia: resultado[0].nombre,
      genero_id: resultado[0].genero_id,
      director_id: resultado[0].director_id,
      actor_id: resultado[0].actor_id,
    }

    // Creamos la query usando la funcion universal sqlBuscarPeliculas
    var sql = sqlBuscarPeliculas(respuesta.genero_id, respuesta.director_id, respuesta.actor_id);
    conexionBaseDeDatos.query(sql, function(error, resultado, campos) {
      if(error) {
        console.log('Hubo un error en la consulta', error.message);
        return res.status(500).send('Hubo un error en la consulta');
      };
      respuesta.peliculas = resultado;
      res.send(JSON.stringify(respuesta));
    })
  })  
};

function votar(req, res) {
  var idCompetencia = req.params.id;
  var idPelicula = req.body.idPelicula;
  console.log(req.body);
  var peticionSql = 'INSERT INTO voto (id_competencia, id_pelicula) VALUES (' + idCompetencia + ', ' + idPelicula + ')';
  conexionBaseDeDatos.query(peticionSql, function(error, resultado, campos) {
    if(error) {
      console.log('Hubo un error al registrar el voto.', error.message);
      return res.status(500).send('Hubo un error al registrar el voto.');
    };
    if(!idCompetencia) {
      console.log('La competencia no existe o no se encuentra en el servidor.');
      return res.status(500).send('La competencia no existe o no se encuentra en el servidor.');
    };
    if(!idPelicula) {
      console.log('La pelicula no existe o no se encuentra en el servidor.');
      return res.status(500).send('La pelicula no existe o no se encuentra en el servidor.');
    };
    console.log(resultado.affectedRows + ' voto agregado!');
    console.log('Competencia: '+idCompetencia+', Pelicula: '+idPelicula);
    return res.status(200).send('Voto registrado!');
  })
};


// Obtenemos los resultados de la competencia seleccionada
function obtenerResultados(req, res) {
  var id = req.params.id;
  var peticionSql = leerSql("obtenerResultados.sql") + id + `
           GROUP BY pelicula.id
           ORDER BY votos DESC
              LIMIT 0,3;`

  conexionBaseDeDatos.query(peticionSql, function(error, resultado, campos) {
    if(error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    };
    // Si la competencia no ha recibido votos devolvemos el mensaje correspondiente
    if(!resultado || resultado.length == 0) {
      console.log('Esta competencia todavia no ha recibido votos.');
      return res.status(422).send('Esta competencia todavia no ha recibido votos');
    } else {
      var respuesta = {
        competencia: resultado[0].nombre,
        resultados: resultado,
      }
      res.status(200).send(JSON.stringify(respuesta));
    }
  })
};

/**
 funcion que permite leer  el contenido de una archivo
  @archivo :: nombre del archivo
  @carpeta :: paranetro opcional del nombre de la carpeta donde se encuentra  el archivo
*/
function leerSql(archivo, carpeta = "sql/") {
   var query = fs.readFileSync(carpeta + archivo).toString()
    .replace(/(\r\n|\n|\r)/gm," ") // remove newlines
    .replace(/\s+/g, ' ') // excess white space
    .split(";") // split into all statements
    .map(Function.prototype.call, String.prototype.trim)
    .filter(function(el) {return el.length != 0}); // remove any empty ones
  return query;
}

module.exports = {
	cargarCompetencia : cargarCompetencia,
	obtenerCompetencia : obtenerCompetencia,
  obtenerOpciones : obtenerOpciones,
  votar : votar,
  obtenerResultados: obtenerResultados,
};
