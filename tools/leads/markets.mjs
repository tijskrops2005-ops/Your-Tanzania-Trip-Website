// Source markets in priority order: the Netherlands first, then the big outbound-travel countries.
// `code` is the Google country code, `lang` the search/interface language.
// agencyTerms → Google Maps searches, blogQueries → Google searches, hashtags → Instagram (without #).
// safariTags → Instagram accounts of people who travel and post about safari.

export const MARKETS = [
  {
    id: 'nl', name: 'Nederland', code: 'nl', lang: 'nl',
    agencyTerms: ['reisbureau', 'reisorganisatie'],
    blogQueries: ['reisblog safari tanzania', 'reisverslag safari tanzania', 'reisblog kenia safari', 'reisblog zuid-afrika rondreis'],
    hashtags: ['reisblogger', 'reisbloggers', 'afrikareis', 'safarireis', 'reisinspiratie'],
    safariTags: ['safarireis', 'tanzaniareis', 'afrikareis'],
  },
  {
    id: 'be', name: 'België', code: 'be', lang: 'nl',
    agencyTerms: ['reisbureau', 'agence de voyage'],
    blogQueries: ['reisblog safari belgie', 'reisblog afrika belg', 'blog voyage safari belgique'],
    hashtags: ['reisbloggerbelgie', 'belgischereisblogger', 'blogvoyagebelgique'],
    safariTags: ['safarireis', 'voyageentanzanie'],
  },
  {
    id: 'de', name: 'Duitsland', code: 'de', lang: 'de',
    agencyTerms: ['Reisebüro', 'Reiseveranstalter'],
    blogQueries: ['Reiseblog Safari Tansania', 'Reisebericht Safari Tansania', 'Reiseblog Kenia Safari', 'Reiseblog Südafrika Rundreise'],
    hashtags: ['reiseblogger', 'reisebloggerin', 'afrikareise', 'safarireise', 'fernweh'],
    safariTags: ['safarireise', 'tansaniareise', 'tansania'],
  },
  {
    id: 'ch', name: 'Zwitserland', code: 'ch', lang: 'de',
    agencyTerms: ['Reisebüro', 'Reiseveranstalter'],
    blogQueries: ['Reiseblog Schweiz Safari', 'Reiseblog Schweiz Afrika', 'Schweizer Reiseblogger'],
    hashtags: ['reisebloggerschweiz', 'schweizerreiseblogger'],
    safariTags: ['safarireise', 'tansaniareise'],
  },
  {
    id: 'gb', name: 'Verenigd Koninkrijk', code: 'gb', lang: 'en',
    agencyTerms: ['travel agent', 'tour operator'],
    blogQueries: ['uk travel blog tanzania safari', 'uk travel blog kenya safari', 'uk travel blogger africa trip', 'uk travel blog south africa road trip'],
    hashtags: ['uktravelblogger', 'britishtravelblogger', 'uktravel'],
    safariTags: ['tanzaniasafari', 'serengeti', 'ngorongoro'],
  },
  {
    id: 'us', name: 'Verenigde Staten', code: 'us', lang: 'en',
    agencyTerms: ['travel agency', 'travel advisor'],
    blogQueries: ['tanzania safari travel blog', 'kenya safari travel blog', 'africa travel blog itinerary', 'serengeti safari blog trip report'],
    hashtags: ['travelblogger', 'travelinfluencer', 'africatravel', 'safarilife'],
    safariTags: ['tanzaniasafari', 'serengeti', 'safarilife'],
  },
  {
    id: 'se', name: 'Zweden', code: 'se', lang: 'sv',
    agencyTerms: ['resebyrå', 'researrangör'],
    blogQueries: ['safari reseblogg', 'reseblogg afrika', 'reseblogg tanzania'],
    hashtags: ['reseblogg', 'reseblogger', 'safariresa', 'afrikaresa'],
    safariTags: ['safariresa', 'tanzaniaresa', 'afrikaresa'],
  },
  {
    id: 'dk', name: 'Denemarken', code: 'dk', lang: 'da',
    agencyTerms: ['rejsebureau', 'rejsearrangør'],
    blogQueries: ['safari rejseblog', 'rejseblog afrika', 'rejseblog tanzania'],
    hashtags: ['rejseblog', 'rejseblogger', 'safarirejse', 'afrikarejse'],
    safariTags: ['safarirejse', 'afrikarejse'],
  },
  {
    id: 'no', name: 'Noorwegen', code: 'no', lang: 'no',
    agencyTerms: ['reisebyrå', 'reisearrangør'],
    blogQueries: ['safari reiseblogg', 'reiseblogg afrika', 'reiseblogg tanzania'],
    hashtags: ['reiseblogg', 'reiseblogger', 'norskreiseblogg'],
    safariTags: ['safaritur', 'tanzaniatur'],
  },
  {
    id: 'fr', name: 'Frankrijk', code: 'fr', lang: 'fr',
    agencyTerms: ['agence de voyage', 'tour opérateur'],
    blogQueries: ['blog voyage safari tanzanie', 'récit de voyage safari tanzanie', 'blog voyage safari kenya', 'blog voyage afrique du sud'],
    hashtags: ['blogvoyage', 'blogueusevoyage', 'voyageafrique', 'safaritanzanie'],
    safariTags: ['safaritanzanie', 'voyagetanzanie', 'voyageentanzanie'],
  },
  {
    id: 'es', name: 'Spanje', code: 'es', lang: 'es',
    agencyTerms: ['agencia de viajes', 'turoperador'],
    blogQueries: ['blog de viajes safari', 'blog de viajes tanzania', 'blog de viajes africa'],
    hashtags: ['blogdeviajes', 'bloguerodeviajes', 'viajarafrica', 'safariafrica'],
    safariTags: ['viajeatanzania', 'safariafrica'],
  },
  {
    id: 'it', name: 'Italië', code: 'it', lang: 'it',
    agencyTerms: ['agenzia viaggi', 'tour operator'],
    blogQueries: ['blog di viaggio safari', 'blog viaggi tanzania', 'blog viaggi africa'],
    hashtags: ['blogdiviaggio', 'travelblogger_it', 'viaggioinafrica'],
    safariTags: ['viaggiointanzania', 'safariintanzania'],
  },
];

export function pickMarkets(arg = 'nl') {
  if (arg === 'all') return MARKETS;
  const ids = arg.split(',').map((s) => s.trim().toLowerCase());
  const unknown = ids.filter((id) => !MARKETS.some((m) => m.id === id));
  if (unknown.length) throw new Error(`Unknown market(s): ${unknown.join(', ')}. Use: ${MARKETS.map((m) => m.id).join(', ')} or all`);
  return MARKETS.filter((m) => ids.includes(m.id));
}
