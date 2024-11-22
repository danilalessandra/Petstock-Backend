package org.iplacex.proyectos.discografia.discos;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface IDiscoRepository extends MongoRepository<Disco, String> {
    @Query("{ 'idArtista': ?0 }")
    List<Disco> findDiscosByIdArtista(String idArtista);
}












