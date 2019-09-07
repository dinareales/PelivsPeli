SELECT competencia.nombre, 
                    pelicula.id, 
                    pelicula.titulo, 
                    pelicula.poster, 
                    count(voto.id_pelicula) as votos
               FROM competencia
               JOIN voto ON voto.id_competencia = competencia.id 
               JOIN pelicula ON voto.id_pelicula = pelicula.id
              WHERE competencia.id = 