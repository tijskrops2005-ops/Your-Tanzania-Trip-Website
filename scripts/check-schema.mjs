// Validates the JSON-LD of built pages against the schema.org vocabulary: every @type must exist,
// every property must be defined for that type (or one of its ancestors), and @id references must
// resolve inside the same graph. Usage:
//   node scripts/check-schema.mjs <vocab.jsonld> [dist paths or slugs...]
// Download the vocabulary first: https://schema.org/version/latest/schemaorg-current-https.jsonld
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const [vocabFile, ...pages] = process.argv.slice(2);
if (!vocabFile) {
  console.error("usage: node scripts/check-schema.mjs <vocab.jsonld> [pages...]");
  process.exit(2);
}

const vocab = JSON.parse(fs.readFileSync(vocabFile, "utf8"));
const S = "schema:";
const classes = new Map(); // name -> [parents]
const props = new Map(); // name -> [domain classes]
const asList = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const localName = (id) => String(id).replace(/^schema:/, "").replace(/^https?:\/\/schema\.org\//, "");
for (const node of vocab["@graph"]) {
  const types = asList(node["@type"]);
  const id = localName(node["@id"]);
  if (types.includes("rdfs:Class")) classes.set(id, asList(node["rdfs:subClassOf"]).map((p) => localName(p["@id"] || p)));
  if (types.includes("rdf:Property")) props.set(id, asList(node[S + "domainIncludes"]).map((p) => localName(p["@id"] || p)));
}
const ancestors = (type, seen = new Set()) => {
  if (!classes.has(type) || seen.has(type)) return seen;
  seen.add(type);
  for (const p of classes.get(type)) ancestors(p, seen);
  return seen;
};

const files = pages.length
  ? pages.map((p) => (p.endsWith(".html") ? p : path.join(root, "dist", p.replace(/^\/|\/$/g, ""), "index.html")))
  : [path.join(root, "dist/index.html")];

let errors = 0;
for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const issues = [];
  const typesSeen = [];
  for (const block of blocks) {
    let data;
    try {
      data = JSON.parse(block);
    } catch (e) {
      issues.push(`invalid JSON: ${e.message}`);
      continue;
    }
    const nodes = Array.isArray(data["@graph"]) ? data["@graph"] : [data];
    const ids = new Set(nodes.map((n) => n["@id"]).filter(Boolean));
    const check = (obj, where) => {
      if (!obj || typeof obj !== "object") return;
      if (Array.isArray(obj)) return obj.forEach((o, i) => check(o, `${where}[${i}]`));
      const types = asList(obj["@type"]);
      if (!types.length) {
        if (obj["@id"] && Object.keys(obj).length === 1 && !ids.has(obj["@id"]) && !obj["@id"].startsWith("http")) issues.push(`${where}: unresolved @id ${obj["@id"]}`);
        return;
      }
      for (const t of types) if (!classes.has(t)) issues.push(`${where}: unknown type ${t}`);
      typesSeen.push(types.join(","));
      const anc = new Set(types.flatMap((t) => [...ancestors(t)]));
      for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith("@")) continue;
        if (!props.has(k)) {
          issues.push(`${where}: unknown property ${k} on ${types.join(",")}`);
          continue;
        }
        const domains = props.get(k);
        if (domains.length && !domains.some((d) => anc.has(d))) issues.push(`${where}: ${k} is not defined for ${types.join(",")} (expects ${domains.join("/")})`);
        check(v, `${where}.${k}`);
      }
    };
    nodes.forEach((n, i) => check(n, `${asList(n["@type"]).join(",") || "node" + i}`));
  }
  const rel = path.relative(root, file);
  if (issues.length) {
    errors += issues.length;
    console.log(`✗ ${rel}\n   ${issues.join("\n   ")}`);
  } else console.log(`✓ ${rel}: ${blocks.length} block(s), ${typesSeen.length} typed nodes (${[...new Set(typesSeen)].join(", ")})`);
}
process.exit(errors ? 1 : 0);
