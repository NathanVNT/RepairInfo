# 07 - Procedures incident et checklists

## Objectif

Fournir un protocole de reponse rapide et standardise.

## Classification

- P1: service indisponible
- P2: fonctionnalite critique degradee
- P3: anomalie mineure

## Procedure incident P1

1. Ouvrir incident et notifier l'astreinte.
2. Confirmer impact (users, perimetre, duree).
3. Verifier status containers et DB.
4. Appliquer correction immediate (redemarrage, rollback, restauration).
5. Valider retour a la normale.
6. Produire post-mortem sous 48h.

## Template post-mortem

- Date et heure debut:
- Date et heure fin:
- Impact:
- Cause racine:
- Actions immediates:
- Actions preventives:
- Proprietaires et deadlines:

## Checklist avant mise en production

- Sauvegarde effectuee
- Plan rollback valide
- Monitoring actif
- Certificat TLS valide
- Comptes admin verifies
- Test fonctionnel OK

## Checklist apres mise en production

- URL accessible
- Authentification OK
- Edition page OK
- Recherche OK
- Logs sans erreur critique

## Journal des changements

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 2026-03-14 | 1.0 | [A_COMPLETER] | Creation de la page |
