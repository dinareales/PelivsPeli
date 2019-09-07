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
      console.log('Esta competencia aun no ha recibido votos.');
      return res.status(422).send('Esta competencia aun no ha recibido votos');
    } else {
      var respuesta = {
        competencia: resultado[0].nombre,
        resultados: resultado,
      }
      res.status(200).send(JSON.stringify(respuesta));
    }
  })
};

//cargamos la lista de generos
function cargarGeneros(req, res) {
  var peticionsql = 'SELECT * FROM genero';
  
  conexionBaseDeDatos.query(peticionsql, function(error, resultado, campos) {
    if(error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    };
    res.status(200).send(JSON.stringify(resultado));
  })
};

// Cargamos la lista de los directores
function cargarDirectores(req, res) {
  var  peticionsql = 'SELECT * FROM director';
  
  conexionBaseDeDatos.query( peticionsql, function(error, resultado, campos) {
    if(error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    };
    res.status(200).send(JSON.stringify(resultado));
  })
};

// cargamos la lista de los actor/actriz 
function cargarActores(req, res) {
  var  peticionsql = 'SELECT * FROM actor';
  
  conexionBaseDeDatos.query(peticionsql, function(error, resultado, campos) {
    if(error) {
      console.log('Hubo un error en la consulta', error.message);
      return res.status(500).send('Hubo un error en la consulta');
    };
    res.status(200).send(JSON.stringify(resultado));
  })
};

// Creamos la competencia con los parametros seleccionados
function crearCompetencia(req, res) {
  var nombre = req.body.nombre === '' ? null : req.body.nombre;
  var genero_id = req.body.genero;
  var director_id = req.body.director;
  var actor_id = req.body.actor;

  // Buscamos si existe una competencia con el mismo nombre
  var busquedaSql = 'SELECT * FROM competencia WHERE nombre = ?'
  conexionBaseDeDatos.query(busquedaSql, [nombre], function(error, resultado, campos) {
    if(resultado && resultado.length !== 0) {
      console.log('La competencia ya existe');
      return res.status(422).send('La competencia ya existe');
    } else {
      // Verificamos que la cantidad de peliculas que coinciden con los parametros seleccionados
      // sea suficiente para crear la competencia
      var sqlBuscarPeli = sqlBuscarPeliculas(genero_id, director_id, actor_id);
      conexionBaseDeDatos.query(sqlBuscarPeli, [nombre], function(error, resultado, campos) {
        if(resultado && resultado.length < 2) {
          console.log('La cantidad de resultados obtenidos no es suficiente para crear una competencia');
          return res.status(422).send('La cantidad de resultados obtenidos no es suficiente para crear una competencia');
        } else {
          var peticionSql = 'INSERT INTO competencia (nombre, genero_id, director_id, actor_id) VALUES (?, ?, ?, ?)';
          conexionBaseDeDatos.query(peticionSql, [nombre, genero_id, director_id, actor_id], function(error, resultado, campos) {
            if(error) {
              console.log('El campo NOMBRE no puede estar en blanco', error.message);
              return res.status(422).send('El campo NOMBRE no puede estar en blanco');
            }
            console.log('Competencia agregada.');
            return res.status(200).send('La competencia se ha creado con exito!');
          })
        };
      })  
    }
  })
};

// Eliminamos los votos de la competencia seleccionada
function eliminarVotos(req, res) {
  var idCompetencia = req.params.id;
  var peticionSql = 'DELETE FROM voto WHERE id_competencia = ?';
  conexionBaseDeDatos.query(peticionSql, [idCompetencia], function(error, resultado, campos) {
    if(error) {
      console.log('No se encuentra la competencia. No se borraron votos.', error.message);
      return res.status(500).send('No se encuentra la competencia. No se borraron votos.');
    };
    console.log('votos eliminados!');
    return res.status(200).send(resultado.affectedRows + ' votos eliminados!');
  })
};

function eliminarCompetencia(req, res) {
  var idCompetencia = req.params.id;
  var peticionSql = 'DELETE FROM competencia WHERE id = ?';
  conexionBaseDeDatos.query(peticionSql, [idCompetencia], function(error, resultado, campos) {
    if(error) {
      console.log('No se encuentra la competencia. Nada para eliminar.', error.message);
      return res.status(404).send('No se encuentra la competencia. Nada para eliminar.');
    };
    eliminarVotos(req, res);
    console.log('Se eliminó ' + resultado.affectedRows + ' competencia con id ' + idCompetencia);
  })
};

// Editamos el nombre de la competencia seleccionada
function editarCompetencia(req, res) {
  var idCompetencia = req.params.id;
  var nuevoNombre = req.body.nombre === '' ? null : req.body.nombre;
  var peticionSql = 'UPDATE competencia SET nombre = ? WHERE id = ?';
  conexionBaseDeDatos.query(peticionSql, [nuevoNombre, idCompetencia], function(error, resultado, campos) {
    if(error) {
      console.log('El campo NOMBRE no puede estar en blanco', error.message);
      return res.status(422).send('El campo NOMBRE no puede estar en blanco');
    }
    if(!idCompetencia) {
      console.log('La competencia no existe');
      return res.status(404).send('La competencia no existe');
    }
    console.log('Se actualizó el nombre de la competencia Nº ' + idCompetencia + ' por ' + nuevoNombre);
    res.status(200).send('Se actualizó el nombre de la competencia por ' + nuevoNombre);
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
  cargarGeneros : cargarGeneros,
  cargarDirectores : cargarDirectores,
  cargarActores : cargarActores,
  crearCompetencia : crearCompetencia,
  eliminarVotos : eliminarVotos,
  eliminarCompetencia : eliminarCompetencia,
  editarCompetencia : editarCompetencia,
};
