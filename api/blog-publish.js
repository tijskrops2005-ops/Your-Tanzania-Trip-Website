// blog-publish: lets an AI agent (BennAI Blog Studio, Claude Code, ...) manage blog posts on
// yourtanzaniatrip.com with an API key. Same routes, fields and answers as the blog-publish edge
// function in Blog Studio's website-kit, so the studio's "Ander systeem" connection works as is.
//
//   GET    /api/blog-publish            list all posts, drafts included (without body)
//   GET    /api/blog-publish/:slug      one post (with body)
//   POST   /api/blog-publish            create a post
//   PUT    /api/blog-publish/:slug      update a post (PATCH works the same)
//   DELETE /api/blog-publish/:slug      delete a post
//   POST   /api/blog-publish/upload     upload a cover image, returns { url }
//
// Every request needs the header `x-api-key: <BLOG_API_KEY>`.
//
// The site is static (Astro), so there is no database: every post is a JSON file in
// content/blog-posts/ of the GitHub repository, and images go to public/blog-images/. Each change
// is one commit on main; Vercel then rebuilds the site and the post is live at /blog/<slug>/
// after about two minutes. Drafts (published: false) are stored but not built.
//
// Environment variables (Vercel → Settings → Environment Variables):
//   BLOG_API_KEY   long random key, shared with the agent
//   GITHUB_TOKEN   fine-grained token with "Contents: read and write" on this repository only
//   GITHUB_REPO    optional, default tijskrops2005-ops/Your-Tanzania-Trip-Website
//   GITHUB_BRANCH  optional, default main
//   SITE_URL       optional, default https://www.yourtanzaniatrip.com
import crypto from "node:crypto";
import reservedSlugs from "./_blog-reserved.js";

const POSTS_DIR = "content/blog-posts";
const IMAGES_DIR = "public/blog-images";
// Vercel accepts request bodies up to 4.5 MB; base64 adds a third, so images stay below 3 MB.
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024;
const IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif", "image/gif": "gif" };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const env = (name, fallback) => process.env[name] || fallback;
const siteUrl = () => env("SITE_URL", "https://www.yourtanzaniatrip.com").replace(/\/+$/, "");

/** "How much to tip on safari?" -> "how-much-to-tip-on-safari" */
export function slugify(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/, "");
}

/** Constant-time comparison, so the key can't be guessed through response timing. */
function safeEqual(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

// ---------- input validation (same rules as the website-kit) ----------

function optionalString(body, key) {
  const value = body[key];
  if (value === undefined || value === null) return value;
  if (typeof value !== "string") throw new HttpError(400, `"${key}" must be a string`);
  return value.trim() === "" ? null : value;
}

function requiredString(body, key, mustExist) {
  const value = body[key];
  if (value === undefined && !mustExist) return undefined;
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `"${key}" is required and must be a non-empty string`);
  }
  return value;
}

function optionalBoolean(body, key) {
  const value = body[key];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw new HttpError(400, `"${key}" must be true or false`);
  return value;
}

function optionalTags(body) {
  const value = body.tags;
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value) || value.some((t) => typeof t !== "string")) {
    throw new HttpError(400, `"tags" must be an array of strings`);
  }
  return [...new Set(value.map((t) => t.trim()).filter(Boolean))];
}

function slugFrom(text) {
  const slug = slugify(text);
  if (!slug) throw new HttpError(400, "Could not make a valid slug; use letters or digits");
  return slug;
}

// ---------- GitHub storage ----------

function repo() {
  const [owner, name] = env("GITHUB_REPO", "tijskrops2005-ops/Your-Tanzania-Trip-Website").split("/");
  return { owner, name, branch: env("GITHUB_BRANCH", "main") };
}

async function gh(method, url, body) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new HttpError(500, "The GITHUB_TOKEN environment variable is not configured");
  const res = await fetch(url.startsWith("https://") ? url : `https://api.github.com${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "yourtanzaniatrip-blog-publish",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { message: text }; }
  if (!res.ok) {
    const err = new HttpError(res.status === 401 || res.status === 403 ? 500 : 502, `GitHub error ${res.status}: ${data?.message || "unknown"}`);
    err.githubStatus = res.status;
    throw err;
  }
  if (data?.errors?.length) throw new HttpError(502, `GitHub error: ${data.errors[0].message}`);
  return data;
}

/** All posts on the branch, read in one GraphQL call (drafts included). */
async function readAllPosts() {
  const { owner, name, branch } = repo();
  const query = `query($owner:String!,$name:String!,$expr:String!){repository(owner:$owner,name:$name){object(expression:$expr){... on Tree{entries{name object{... on Blob{text}}}}}}}`;
  const data = await gh("POST", "/graphql", { query, variables: { owner, name, expr: `${branch}:${POSTS_DIR}` } });
  const entries = data?.data?.repository?.object?.entries || [];
  return entries
    .filter((e) => e.name.endsWith(".json") && e.object?.text)
    .map((e) => JSON.parse(e.object.text));
}

/**
 * One commit with all changes. files: [{ path, text } | { path, base64 } | { path, delete: true }].
 * Retries when main moved on in between (another post, or a push from the owner).
 */
async function commit(files, message) {
  const { owner, name, branch } = repo();
  const base = `/repos/${owner}/${name}`;
  const tree = [];
  for (const f of files) {
    if (f.delete) tree.push({ path: f.path, mode: "100644", type: "blob", sha: null });
    else if (f.base64 !== undefined) {
      const blob = await gh("POST", `${base}/git/blobs`, { content: f.base64, encoding: "base64" });
      tree.push({ path: f.path, mode: "100644", type: "blob", sha: blob.sha });
    } else tree.push({ path: f.path, mode: "100644", type: "blob", content: f.text });
  }
  for (let attempt = 0; ; attempt++) {
    const ref = await gh("GET", `${base}/git/ref/heads/${branch}`);
    const parent = await gh("GET", `${base}/git/commits/${ref.object.sha}`);
    const newTree = await gh("POST", `${base}/git/trees`, { base_tree: parent.tree.sha, tree });
    const newCommit = await gh("POST", `${base}/git/commits`, { message, tree: newTree.sha, parents: [ref.object.sha] });
    try {
      await gh("PATCH", `${base}/git/refs/heads/${branch}`, { sha: newCommit.sha });
      return newCommit.sha;
    } catch (err) {
      if (err.githubStatus === 422 && attempt < 2) continue; // not a fast-forward: try again on the new head
      throw err;
    }
  }
}

const postPath = (slug) => `${POSTS_DIR}/${slug}.json`;
const postFile = (post) => ({ path: postPath(post.slug), text: JSON.stringify(post, null, 2) + "\n" });
const publicUrl = (slug) => `${siteUrl()}/blog/${slug}/`;
const withoutBody = ({ body, previous_slugs, ...rest }) => rest;
const forClient = ({ previous_slugs, ...rest }) => ({ ...rest, url: publicUrl(rest.slug) });

// ---------- images ----------

/** Turns base64 or a data: URI into an image file in public/blog-images/. */
function imageFile(raw, contentType, filename) {
  let type = contentType;
  let base64 = raw;
  const m = /^data:([^;,]+);base64,/.exec(raw);
  if (m) {
    type = type || m[1];
    base64 = raw.slice(m[0].length);
  }
  type = type || "image/webp";
  if (!type.startsWith("image/")) throw new HttpError(400, `"content_type" must be an image type`);
  if (!IMAGE_TYPES[type]) throw new HttpError(400, `Image type ${type} is not supported; use JPEG, PNG, WebP, AVIF or GIF`);
  base64 = base64.replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) throw new HttpError(400, `"data" must be base64-encoded`);
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length === 0) throw new HttpError(400, `"data" must be base64-encoded`);
  if (bytes.length > MAX_UPLOAD_BYTES) throw new HttpError(413, "Image is larger than 3 MB");

  const ext = IMAGE_TYPES[type];
  let stem = (filename || "cover").toLowerCase().replace(/\.[a-z0-9]+$/, "").replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "cover";
  const name = `${Date.now()}-${stem}.${ext}`;
  return { file: { path: `${IMAGES_DIR}/${name}`, base64 }, url: `${siteUrl()}/blog-images/${name}`, path: name };
}

/** cover_url sent as a data: URI (Blog Studio without upload URL) becomes a real image file. */
function coverFromBody(body, files, slugHint) {
  const value = optionalString(body, "cover_url");
  if (typeof value === "string" && value.startsWith("data:")) {
    const img = imageFile(value, null, slugHint);
    files.push(img.file);
    return img.url;
  }
  if (typeof value === "string" && !/^https?:\/\//.test(value) && !value.startsWith("/")) {
    throw new HttpError(400, `"cover_url" must be an http(s) URL or a data: URI`);
  }
  return value;
}

// ---------- routes ----------

function findPost(posts, slug) {
  const post = posts.find((p) => p.slug === slug);
  if (!post) throw new HttpError(404, `No post found with slug "${slug}"`);
  return post;
}

function assertFreeSlug(posts, slug, ownId) {
  if (reservedSlugs.includes(slug) || posts.some((p) => p.slug === slug && p.id !== ownId)) {
    throw new HttpError(409, "A post with this slug already exists");
  }
}

async function listPosts() {
  const posts = await readAllPosts();
  posts.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return [200, { posts: posts.map(withoutBody).map(forClient) }];
}

async function getPost(slug) {
  return [200, { post: forClient(findPost(await readAllPosts(), slug)) }];
}

async function createPost(body) {
  const title = requiredString(body, "title", true);
  const content = requiredString(body, "body", true);
  const publish = optionalBoolean(body, "publish") ?? true;
  const slug = slugFrom(optionalString(body, "slug") ?? title);
  const posts = await readAllPosts();
  assertFreeSlug(posts, slug);

  const files = [];
  const now = new Date().toISOString();
  const post = {
    id: crypto.randomUUID(),
    title,
    slug,
    excerpt: optionalString(body, "excerpt") ?? null,
    body: content,
    cover_url: coverFromBody(body, files, slug) ?? null,
    author: optionalString(body, "author") ?? null,
    tags: optionalTags(body) ?? [],
    published: publish,
    published_at: publish ? now : null,
    created_at: now,
    updated_at: now,
  };
  files.push(postFile(post));
  await commit(files, `Blog: ${publish ? "publish" : "draft"} "${title}"`);
  return [201, { post: forClient(post) }];
}

async function updatePost(slug, body) {
  const posts = await readAllPosts();
  const existing = findPost(posts, slug);
  const post = { ...existing };
  const files = [];
  let changed = false;
  const set = (key, value) => { post[key] = value; changed = true; };

  const title = requiredString(body, "title", false);
  if (title !== undefined) set("title", title);
  const content = requiredString(body, "body", false);
  if (content !== undefined) set("body", content);
  for (const key of ["excerpt", "author"]) {
    const value = optionalString(body, key);
    if (value !== undefined) set(key, value);
  }
  if (body.cover_url !== undefined) set("cover_url", coverFromBody(body, files, slug) ?? null);
  const tags = optionalTags(body);
  if (tags !== undefined) set("tags", tags);

  const newSlug = optionalString(body, "new_slug");
  if (newSlug) {
    const s = slugFrom(newSlug);
    if (s !== slug) {
      assertFreeSlug(posts, s, existing.id);
      set("slug", s);
      // A live post keeps working on its old address (redirect in astro.config.mjs).
      if (existing.published) post.previous_slugs = [...new Set([...(existing.previous_slugs || []), slug])];
    }
  }

  const publish = optionalBoolean(body, "publish");
  if (publish === true) {
    // Keep the original date when a live post is only being edited.
    set("published", true);
    post.published_at = existing.published && existing.published_at ? existing.published_at : new Date().toISOString();
  } else if (publish === false) {
    set("published", false);
    post.published_at = null;
  }

  if (!changed) throw new HttpError(400, "Nothing to update: send at least one field");
  post.updated_at = new Date().toISOString();

  if (post.slug !== slug) files.push({ path: postPath(slug), delete: true });
  files.push(postFile(post));
  await commit(files, `Blog: update "${post.title}"`);
  return [200, { post: forClient(post) }];
}

async function deletePost(slug) {
  const post = findPost(await readAllPosts(), slug);
  await commit([{ path: postPath(slug), delete: true }], `Blog: delete "${post.title}"`);
  return [200, { deleted: slug }];
}

/** Body: { filename?, content_type?, data: base64 (or a data: URI) } -> { url } */
async function uploadImage(body) {
  const raw = requiredString(body, "data", true);
  const img = imageFile(raw, optionalString(body, "content_type"), optionalString(body, "filename"));
  await commit([img.file], `Blog: upload image ${img.path}`);
  return [201, { url: img.url, path: img.path }];
}

function readBody(req) {
  let body;
  try { body = req.body; } catch { throw new HttpError(400, "Request body must be valid JSON"); } // Vercel parses lazily
  if (Buffer.isBuffer(body)) body = body.toString("utf8");
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { throw new HttpError(400, "Request body must be valid JSON"); }
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }
  return body;
}

async function route(req) {
  const expectedKey = process.env.BLOG_API_KEY;
  if (!expectedKey) throw new HttpError(500, "The BLOG_API_KEY environment variable is not configured");
  if (!safeEqual(String(req.headers["x-api-key"] || ""), expectedKey)) {
    throw new HttpError(401, "Invalid or missing x-api-key header");
  }

  // /api/blog-publish/<slug> arrives here as ?path=<slug> (rewrite in vercel.json).
  const url = new URL(req.url, "http://localhost");
  const rest = (url.searchParams.get("path") || "").split("/").filter(Boolean);
  if (rest.length > 1) throw new HttpError(404, "Unknown route");
  const slug = rest[0] ? decodeURIComponent(rest[0]) : null;

  switch (req.method) {
    case "GET":
      return slug ? getPost(slug) : listPosts();
    case "POST":
      if (slug === "upload") return uploadImage(readBody(req));
      if (slug) throw new HttpError(405, "Use PUT or PATCH to update an existing post");
      return createPost(readBody(req));
    case "PUT":
    case "PATCH":
      if (!slug) throw new HttpError(400, "Add the slug to the URL: /api/blog-publish/<slug>");
      return updatePost(slug, readBody(req));
    case "DELETE":
      if (!slug) throw new HttpError(400, "Add the slug to the URL: /api/blog-publish/<slug>");
      return deletePost(slug);
    default:
      throw new HttpError(405, `Method ${req.method} is not allowed`);
  }
}

export default async function handler(req, res) {
  for (const [k, v] of Object.entries(corsHeaders)) res.setHeader(k, v);
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    return res.end("ok");
  }
  let status, data;
  try {
    [status, data] = await route(req);
  } catch (err) {
    if (err instanceof HttpError) [status, data] = [err.status, { error: err.message }];
    else {
      console.error("blog-publish error:", err);
      [status, data] = [500, { error: "Internal server error" }];
    }
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}
