# 09 - FAQ et depannage

## FAQ

### Comment reinitialiser un mot de passe admin ?
- Utiliser la procedure officielle Wiki.js ou l'IDP si auth externe.
- Documenter l'action dans le journal d'exploitation.

### Pourquoi une page n'apparait pas dans la recherche ?
- Verifier publication de la page.
- Verifier permissions de lecture.
- Verifier indexation du moteur de recherche.

### Peut-on restaurer une ancienne version d'une page ?
- Oui, via l'historique de revisions (si active).
- Sinon, restaurer depuis backup applicatif/DB.

## Depannage rapide

### Cas 1: Wiki inaccessible
1. Verifier reverse proxy.
2. Verifier containers `wikijs` et `wikijs-db`.
3. Verifier logs app et DB.

### Cas 2: Erreur base de donnees
1. Tester connectivite DB.
2. Verifier credentials dans `.env`.
3. Verifier espace disque volume DB.

### Cas 3: Lenteur importante
1. Verifier CPU/RAM hote.
2. Verifier saturation disque et i/o.
3. Verifier requetes longues cote DB.

## Commandes de diagnostic

```bash
docker compose ps
docker compose logs --tail=200 wiki
docker compose logs --tail=200 db
docker stats --no-stream
```

## Journal des changements

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 2026-03-14 | 1.0 | [A_COMPLETER] | Creation de la page |
