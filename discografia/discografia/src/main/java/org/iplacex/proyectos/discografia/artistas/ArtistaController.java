package org.iplacex.proyectos.discografia.artistas;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class ArtistaController {

    @Autowired
    private IArtistaRepository artistaRepository;

    @PostMapping(value = "/artista", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Artista> HandleInsertArtistaRequest(@RequestBody Artista artista) {
        Artista savedArtista = artistaRepository.save(artista);
        return ResponseEntity.ok(savedArtista);
    }

    @GetMapping(value = "/artistas", produces = "application/json")
    public ResponseEntity<List<Artista>> HandleGetAristasRequest() {
        List<Artista> artistas = artistaRepository.findAll();
        return ResponseEntity.ok(artistas);
    }

    @GetMapping(value = "/artista/{id}", produces = "application/json")
    public ResponseEntity<Artista> HandleGetArtistaRequest(@PathVariable String id) {
        return artistaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping(value = "/artista/{id}", consumes = "application/json", produces = "application/json")
    public ResponseEntity<Artista> HandleUpdateArtistaRequest(@PathVariable String id, @RequestBody Artista artista) {
        if (!artistaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        artista._id = id;
        Artista updatedArtista = artistaRepository.save(artista);
        return ResponseEntity.ok(updatedArtista);
    }

    @DeleteMapping(value = "/artista/{id}", produces = "application/json")
    public ResponseEntity<Void> HandleDeleteArtistaRequest(@PathVariable String id) {
        if (!artistaRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        artistaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}





















































