# BLACK FRAME MOBILE — Phase A : sauvegarde, migration et architecture

## Périmètre

Cette phase prépare la migration sans modifier la source actuelle de vérité.

- `localStorage["blackframe_phones"]` reste utilisé par l’admin et le site public.
- `localStorage["blackframe_rate"]` reste le taux actif.
- PostgreSQL reste vierge.
- Aucune route métier n’est implémentée côté Express.
- L’authentification actuelle n’est pas remplacée.

Le point de sécurité `gitsafe-backup/main` correspond au commit de `main` au moment de la préparation de Phase A. Il ne doit pas être supprimé.

## Format de sauvegarde JSON

```json
{
  "version": 1,
  "exportedAt": "2026-08-10T12:00:00.000Z",
  "exchangeRate": 2500,
  "phones": []
}
```

Le module `src/lib/migration.ts` fournit :

- la création du payload;
- la sérialisation lisible;
- la validation;
- la restauration explicite;
- la transformation vers le futur format.

L’export ne supprime aucune clé du navigateur. La restauration ne se fait qu’après validation et confirmation dans l’interface.

## Structure legacy identifiée

### Téléphone

| Champ legacy | Type | Règle |
| --- | --- | --- |
| `id` | `string` | identifiant non vide |
| `model` | `string` | modèle non vide |
| `purchasePrice` | `number` | nombre fini positif ou nul |
| `repairCost` | `number` | nombre fini positif ou nul |
| `salePrice` | `number` | nombre fini positif ou nul |
| `minPrice` | `number` | nombre fini positif ou nul |
| `status` | enum | `Disponible`, `Réservé`, `Vendu` |
| `purchaseDate` | `string` | date `AAAA-MM-JJ` valide |
| `saleDate` | `string?` | date `AAAA-MM-JJ` valide |
| `notes` | `string` | champ texte |
| `media` | `MediaItem[]` | tableau de médias |

### Média legacy

| Champ legacy | Type | Futur champ |
| --- | --- | --- |
| `id` | `string` | `legacyId` / mapping |
| `type` | `image \| video` | `type` |
| `src` | `string` | `url` ou objet stocké |
| `name?` | `string?` | `filename` |

Les fichiers importés par l’interface sont convertis en Data URLs via `FileReader.readAsDataURL`. Les liens URL sont stockés tels quels.

## Validation

Le validateur Zod détecte :

- enveloppe de sauvegarde incorrecte;
- champs manquants;
- prix non numériques, négatifs ou non finis;
- statuts inconnus;
- dates impossibles;
- média sans identifiant, type ou source valide;
- Data URL mal formée;
- URL qui n’est pas HTTP(S);
- identifiants de téléphones dupliqués.

Un téléphone avec une erreur de schéma ou un identifiant dupliqué n’est pas compté comme valide.

## Futur contrat PostgreSQL

Le contrat métier prévu est :

### `phones`

```text
id             string / UUID serveur
model          string
purchasePrice  number
repairCost     number
salePrice      number
minimumPrice   number
status         Disponible | Réservé | Vendu
purchaseDate   date
soldDate       date nullable
notes          string
createdAt      datetime
updatedAt      datetime
```

### `phone_media`

```text
id         string / UUID serveur
phoneId    string / UUID phone
type       image | video
url        string / object path
filename   string
createdAt  datetime
```

### `exchange_rates`

```text
id            string / UUID serveur
currencyFrom  string
currencyTo    string
rate          number
updatedAt     datetime
```

### `settings`

```text
key        string
value      string
updatedAt  datetime
```

Ces descriptions et les types Phase A ne créent aucune table et ne sont pas importés dans le schéma Drizzle.

## Compatibilité et identifiants

La transformation conserve :

- `minPrice` dans `minimumPrice`;
- `saleDate` dans `soldDate`;
- `media[].src` dans `DatabaseMedia.url`;
- `media[].name` dans `DatabaseMedia.filename`;
- chaque ancien identifiant dans `legacyId`;
- une liste explicite `idMappings`.

La stratégie cible est :

1. conserver l’ancien ID comme clé de correspondance;
2. générer un UUID pour le nouvel enregistrement PostgreSQL;
3. enregistrer la correspondance pendant l’import;
4. ne jamais faire dépendre la migration d’un ID basé sur `Date.now()`.

Les IDs actuels sont des chaînes créées avec `Date.now().toString()`. Les IDs média utilisent `Date.now().toString(36)` plus une partie aléatoire. Ils sont exploitables pour la correspondance, mais ne constituent pas une garantie UUID ou une clé distribuée sans collision.

## Architecture `StorageService`

Le contrat préparé dans `artifacts/api-server/src/lib/storage-service.ts` sépare :

- le contenu binaire;
- les métadonnées;
- le chemin d’objet;
- l’URL de lecture;
- les opérations `put`, `get` et `delete`.

La future implémentation devra utiliser App Storage / stockage objet pour les octets et ne conserver en PostgreSQL que le chemin et les métadonnées.

### Limites actuelles des médias

- taille maximale UI par fichier : `5 MB`;
- maximum UI : `8 médias par téléphone`;
- types acceptés par le sélecteur : `image/*`, `video/*`;
- détection vidéo URL : extensions vidéo courantes ou URL contenant `video`;
- fichiers locaux : Data URL base64 dans `media[].src`;
- liens distants : URL HTTP(S) dans `media[].src`;
- emplacement actuel : valeur JSON de `blackframe_phones`;
- fichiers locaux non séparés du stock.

Une Data URL augmente la taille par rapport au fichier binaire et le JSON/localStorage utilise des chaînes navigateur. La capacité localStorage dépend du navigateur et de l’origine; elle est souvent de quelques mégaoctets, sans garantie contractuelle. Plusieurs médias de 5 MB peuvent donc remplir le quota avant huit éléments.

## Authentification actuelle

L’accès actuel est un garde client :

- `admin.html` compare le mot de passe côté navigateur;
- la réussite écrit `localStorage["admin_logged"] = "true"`;
- `App.tsx` lit ce flag avant le rendu;
- la déconnexion supprime le flag;
- les pages publiques ne sont pas protégées.

Points faibles :

- secret vérifiable dans le JavaScript livré au navigateur;
- flag modifiable par la console;
- aucune session serveur;
- aucune expiration;
- aucune identité utilisateur;
- aucune permission;
- aucune protection des mutations localStorage.

Routes à protéger dans une future phase :

- création, modification et suppression de téléphones;
- changement du taux;
- marquage vendu;
- import, export et restauration;
- gestion des médias;
- paramètres et CMS;
- rapports administratifs.

La stratégie recommandée est une authentification serveur avec session HttpOnly sécurisée, expiration, rotation et rôles/permissions. Le dashboard devra ensuite gérer les états non authentifié, session expirée et accès refusé. Cette migration est volontairement exclue de Phase A.

## Restauration

1. Sélectionner un fichier `.json`.
2. Parser son contenu.
3. Valider la version, le taux, les dates, les téléphones et les médias.
4. Afficher le total, les valides, les invalides et les doublons.
5. Refuser le bouton de confirmation si le rapport n’est pas entièrement valide.
6. Demander une confirmation explicite.
7. Écrire uniquement `blackframe_phones` et `blackframe_rate`.
8. Ne supprimer aucune autre donnée.
9. Recharger l’interface après confirmation.

## Contrat API préparé

Le contrat OpenAPI est dans `lib/api-spec/openapi.yaml`. Il décrit les routes futures suivantes sans les brancher à Express :

```text
GET    /api/healthz
GET    /api/phones
GET    /api/phones/{id}
POST   /api/phones
PATCH  /api/phones/{id}
DELETE /api/phones/{id}
POST   /api/phones/{id}/sold
GET    /api/exchange-rates/current
```

Après modification du YAML, le codegen doit être relancé avant toute utilisation des hooks générés :

```bash
pnpm --filter @workspace/api-spec run codegen
```
