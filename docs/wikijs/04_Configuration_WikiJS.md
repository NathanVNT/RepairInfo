# 04 - Configuration Wiki.js

## Objectif

Formaliser la configuration initiale et les standards de parametrage.

## Configuration initiale

- Nom du site: [A_COMPLETER]
- URL canonique: [A_COMPLETER]
- Langue: fr
- Fuseau horaire: [A_COMPLETER]
- Compte administrateur initial: [A_COMPLETER]

## Authentification

- Mode: [Local / LDAP / OIDC / SAML]
- Fournisseur: [A_COMPLETER]
- MFA: [Oui/Non]
- Politique mot de passe: [A_COMPLETER]

## Groupes et permissions

- Admins: administration complete
- Editeurs: creation + edition des pages
- Lecteurs: consultation uniquement

## Standard de structuration des contenus

- Utiliser des chemins explicites: `runbook/`, `procedures/`, `faq/`
- Nommer les pages avec prefixes numeriques pour l'ordre
- Ajouter des tags metier et techniques
- Ajouter "Derniere mise a jour" en bas de page

## Integrations possibles

- Git sync: [active/desactive]
- Search externe: [A_COMPLETER]
- Webhooks: [A_COMPLETER]

## Points de controle

- Les permissions sont testees par role
- L'edition markdown fonctionne
- Les medias s'uploadent correctement
- Le moteur de recherche retourne les pages attendues

## Journal des changements

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 2026-03-14 | 1.0 | [A_COMPLETER] | Creation de la page |
