// Static blog builder. Run: node scripts/build-blog.mjs
// Reads blog-src/*.md, writes blog/, sitemap.xml, feed.xml, robots.txt, llms.txt, llms-full.txt
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://devanasolver.github.io/youtube-creator-toolkit/';
const NAME = 'Creator Toolkit';
const MODIFIED = process.env.BUILD_DATE || '2026-10-18';
const SRC = path.join(ROOT, 'blog-src');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const slugify = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const fmtDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

function parse(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter: ' + file);
  const meta = {};
  m[1].split('\n').forEach(l => { const i = l.indexOf(':'); if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  meta.related = (meta.related || '').split(',').map(s => s.trim()).filter(Boolean);
  return { meta, body: m[2].trim() };
}

// ---- inline + block markdown (small subset) ----
// Links: [t](url). "@/" = site root. "@tool/" = tool anchor handled via full URL.
function inline(s, ctx) {
  let out = esc(s);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
    u = u.replace(/&amp;/g, '&');
    const ext = /^https?:/.test(u);
    if (u.startsWith('@/')) u = ctx.root + u.slice(2);
    return `<a href="${esc(u)}"${ext ? ' rel="noopener"' : ''}>${t}</a>`;
  });
  return out;
}
function plain(s) { // strip markdown for schema text
  return s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1').replace(/[*`]/g, '');
}
function absMd(s) { // markdown for LLM copy: absolute links
  return s.replace(/\]\(@\//g, `](${SITE}`);
}

function render(body, ctx) {
  const lines = body.split('\n');
  const html = [], toc = [], faq = [], steps = [];
  let i = 0, curH2 = '', section = '';
  const para = [];
  const flush = () => { if (para.length) { html.push(`<p>${inline(para.join(' '), ctx)}</p>`); para.length = 0; } };
  while (i < lines.length) {
    const l = lines[i];
    if (!l.trim()) { flush(); i++; continue; }
    let m;
    if ((m = l.match(/^## (.+)$/))) {
      flush(); curH2 = m[1]; section = /^faq|^frequently/i.test(curH2) ? 'faq' : /^how to/i.test(curH2) ? 'howto' : '';
      const id = slugify(curH2); toc.push({ id, text: curH2 });
      html.push(`<h2 id="${id}">${inline(curH2, ctx)}</h2>`); i++; continue;
    }
    if ((m = l.match(/^### (.+)$/))) {
      flush(); const id = slugify(m[1]);
      html.push(`<h3 id="${id}">${inline(m[1], ctx)}</h3>`);
      if (section === 'faq') {
        const ans = []; i++;
        while (i < lines.length && !/^#{2,3} /.test(lines[i])) { ans.push(lines[i]); i++; }
        const text = ans.join('\n').trim();
        faq.push({ q: m[1], a: text });
        html.push(...text.split(/\n\n+/).map(p => `<p>${inline(p.replace(/\n/g, ' '), ctx)}</p>`));
        continue;
      }
      i++; continue;
    }
    if (/^```/.test(l)) { flush(); const c = []; i++; while (i < lines.length && !/^```/.test(lines[i])) { c.push(lines[i]); i++; } i++; html.push(`<pre><code>${esc(c.join('\n'))}</code></pre>`); continue; }
    if (/^> /.test(l)) { flush(); const q = []; while (i < lines.length && /^> ?/.test(lines[i])) { q.push(lines[i].replace(/^> ?/, '')); i++; } html.push(`<blockquote>${inline(q.join(' '), ctx)}</blockquote>`); continue; }
    if (/^\|/.test(l)) {
      flush(); const rows = []; while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = r => r.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const head = cells(rows[0]), data = rows.slice(2).map(cells);
      html.push(`<div class="table-wrap"><table><thead><tr>${head.map(c => `<th>${inline(c, ctx)}</th>`).join('')}</tr></thead><tbody>${data.map(r => `<tr>${r.map(c => `<td>${inline(c, ctx)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }
    if (/^- /.test(l)) { flush(); const it = []; while (i < lines.length && /^- /.test(lines[i])) { it.push(lines[i].slice(2)); i++; } html.push(`<ul>${it.map(x => `<li>${inline(x, ctx)}</li>`).join('')}</ul>`); continue; }
    if (/^\d+\. /.test(l)) {
      flush(); const it = []; while (i < lines.length && /^\d+\. /.test(lines[i])) { it.push(lines[i].replace(/^\d+\. /, '')); i++; }
      if (section === 'howto') it.forEach(x => steps.push(plain(x)));
      html.push(`<ol>${it.map(x => `<li>${inline(x, ctx)}</li>`).join('')}</ol>`); continue;
    }
    para.push(l.trim()); i++;
  }
  flush();
  return { html: html.join('\n'), toc, faq, steps };
}

// ---- shared chrome ----
const head = (o, root) => `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<link rel="canonical" href="${o.url}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<meta property="og:site_name" content="${NAME}">
<meta property="og:type" content="${o.type}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${o.url}">
<meta property="og:image" content="${o.image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(o.title)}">
<meta name="twitter:description" content="${esc(o.description)}">
<meta name="twitter:image" content="${o.image}">
${o.extraHead || ''}<link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
<link rel="alternate" type="application/rss+xml" title="${NAME} blog" href="${SITE}feed.xml">
<link rel="stylesheet" href="${root}assets/css/styles.css">
<link rel="stylesheet" href="${root}assets/css/blog.css">
<script>try{var t=new URLSearchParams(location.search).get("theme");t=(t==="light"||t==="dark")?t:localStorage.getItem("ct-theme");if(!t&&matchMedia("(prefers-color-scheme: light)").matches)t="light";if(t)document.documentElement.setAttribute("data-theme",t);}catch(e){}</script>
${o.ld.map(x => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}
</head>
<body>
<div class="glow glow-a"></div>
<div class="glow glow-b"></div>
<header class="site-header">
  <a class="brand" href="${root}">
    <img src="${root}assets/img/logo.svg" alt="Creator Toolkit logo" width="40" height="40">
    <span>Creator Toolkit</span>
  </a>
  <nav class="main-nav" aria-label="Main">
    <a href="${root}#thumbnails">Tools</a>
    <a href="${root}blog/" aria-current="page" class="active">Blog</a>
  </nav>
  <a class="blog-link active" href="${root}blog/">Blog</a>
  <a class="btn-support" href="https://buymeacoffee.com/isaac49" target="_blank" rel="noopener">&#9749; <span>Buy me a coffee</span></a>
  <button id="themeToggle" class="theme-toggle" aria-label="Switch between dark and light theme">
    <span class="icon-sun">&#9728;</span><span class="icon-moon">&#9790;</span>
  </button>
</header>
`;
const foot = root => `
<footer class="site-footer">
  <img src="${root}assets/img/logo.svg" alt="" width="28" height="28">
  <p>Creator Toolkit - free tools for YouTube creators. Open source under the MIT license.</p>
  <p class="fine">Not affiliated with YouTube or Google. Articles are written for general guidance and checked against YouTube's public help pages on the date shown. YouTube changes its rules, so check the linked source before you rely on a number.</p>
  <p class="foot-links"><a href="${root}">Tools</a> <a href="${root}blog/">Blog</a> <a href="${SITE}feed.xml">RSS</a> <a href="${SITE}llms.txt">llms.txt</a> <a href="https://github.com/devanasolver/youtube-creator-toolkit" rel="noopener">GitHub</a></p>
  <p class="support-line">Find it useful? <a href="https://buymeacoffee.com/isaac49" target="_blank" rel="noopener">Buy me a coffee</a> - it keeps the tools free.</p>
</footer>
<script src="${root}assets/js/blog.js"></script>
</body>
</html>
`;

// ---- load posts ----
const posts = fs.readdirSync(SRC).filter(f => f.endsWith('.md')).map(f => {
  const { meta, body } = parse(path.join(SRC, f));
  return { ...meta, body, file: f };
}).sort((a, b) => b.date.localeCompare(a.date));
const bySlug = Object.fromEntries(posts.map(p => [p.slug, p]));

const orgLd = { '@type': 'Organization', name: NAME, url: SITE, logo: { '@type': 'ImageObject', url: SITE + 'assets/og/default.png' } };
fs.rmSync(path.join(ROOT, 'blog'), { recursive: true, force: true });
fs.mkdirSync(path.join(ROOT, 'blog'), { recursive: true });

function promptFor(p, url) {
  return `Read this article and answer from it: ${url}\n\nGive me a short summary, the key steps, and the limits it mentions about the ${p.toolName}. Then ask what I want to do next.`;
}

const full = [];
for (const p of posts) {
  const root = '../../';
  const url = `${SITE}blog/${p.slug}/`;
  const r = render(p.body, { root });
  const words = p.body.split(/\s+/).length;
  const minutes = Math.max(2, Math.round(words / 220));
  const toolUrl = `${SITE}#${p.tool}`;
  const image = `${SITE}assets/og/${p.slug}.png`;
  const related = p.related.map(s => bySlug[s]).filter(Boolean);
  // Markdown for LLM copy
  const sources = (p.sources || '').split(' ').filter(Boolean);
  const md = [
    `# ${p.title}`, '',
    `Source: ${url}`, `Published: ${p.date} | Updated: ${MODIFIED} | Site: ${NAME} (free YouTube creator tools)`,
    `Related free tool: ${p.toolName} - ${toolUrl}`, '',
    `**TL;DR:** ${absMd(p.tldr)}`, '',
    absMd(p.body), '',
    sources.length ? '## Sources\n\n' + sources.map(s => `- ${s}`).join('\n') + '\n' : '',
    `---\nFrom ${NAME}: ${SITE}`
  ].join('\n');
  fs.mkdirSync(path.join(ROOT, 'blog', p.slug), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'blog', p.slug, 'index.md'), md);
  full.push(md);

  const ld = [
    { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.description, image: [image], datePublished: p.date, dateModified: MODIFIED, mainEntityOfPage: { '@type': 'WebPage', '@id': url }, author: orgLd, publisher: orgLd, inLanguage: 'en', wordCount: words, articleSection: 'YouTube creator guides' },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: NAME, item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: SITE + 'blog/' },
      { '@type': 'ListItem', position: 3, name: p.title, item: url } ] }
  ];
  if (r.faq.length) ld.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: r.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: plain(f.a.replace(/\n+/g, ' ')) } })) });
  if (r.steps.length) ld.push({ '@context': 'https://schema.org', '@type': 'HowTo', name: p.howtoName || p.title, description: p.description, step: r.steps.map((s, n) => ({ '@type': 'HowToStep', position: n + 1, name: s.split(/[.:]/)[0].slice(0, 90), text: s })) });

  const mdForCopy = md.replace(/<\/script/gi, '<\\/script');
  const prompt = promptFor(p, url);
  const q = encodeURIComponent(prompt);
  const page = head({ title: `${p.title} | ${NAME}`, description: p.description, url, type: 'article', image, ld,
    extraHead: `<meta property="article:published_time" content="${p.date}">\n<meta property="article:modified_time" content="${MODIFIED}">\n<link rel="alternate" type="text/markdown" href="${url}index.md">\n` }, root) + `
<main class="blog-main">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${root}">${NAME}</a><span>/</span><a href="${root}blog/">Blog</a><span>/</span><span aria-current="page">${esc(p.short || p.title)}</span></nav>
  <article class="post glass" itemscope itemtype="https://schema.org/BlogPosting">
    <header class="post-head">
      <p class="eyebrow">${esc(p.category)}</p>
      <h1 itemprop="headline">${esc(p.title)}</h1>
      <p class="post-meta"><time datetime="${p.date}" itemprop="datePublished">${fmtDate(p.date)}</time> &middot; Updated <time datetime="${MODIFIED}" itemprop="dateModified">${fmtDate(MODIFIED)}</time> &middot; ${minutes} min read</p>
    </header>
    <aside class="tldr" aria-label="Short answer"><strong>TL;DR</strong><p>${inline(p.tldr, { root })}</p></aside>
    <div class="llm-bar" role="group" aria-label="Use this article with an AI assistant">
      <button type="button" class="btn btn-mini llm-copy" id="llmCopy">Copy for LLM</button>
      <a class="btn btn-mini" href="https://chatgpt.com/?q=${q}" target="_blank" rel="noopener">Open in ChatGPT</a>
      <a class="btn btn-mini" href="https://claude.ai/new?q=${q}" target="_blank" rel="noopener">Open in Claude</a>
      <a class="btn btn-mini" href="https://www.perplexity.ai/search?q=${q}" target="_blank" rel="noopener">Ask Perplexity</a>
      <a class="btn btn-mini" href="index.md">View as Markdown</a>
    </div>
    <script type="text/markdown" id="postMd">${mdForCopy}</script>
    <nav class="toc" aria-label="On this page"><strong>On this page</strong><ol>${r.toc.map(t => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol></nav>
    <div class="prose" itemprop="articleBody">
${r.html}
    </div>
    <aside class="cta glass-in">
      <h2>Try it: ${esc(p.toolName)}</h2>
      <p>${inline(p.cta, { root })}</p>
      <a class="btn btn-primary" href="${root}#${p.tool}">Open the ${esc(p.toolName)}</a>
    </aside>
    ${sources.length ? `<section class="sources"><h2>Sources</h2><ul>${sources.map(s => `<li><a href="${esc(s)}" rel="noopener">${esc(s.replace(/^https?:\/\//, ''))}</a></li>`).join('')}</ul><p class="hint">Checked on ${fmtDate(MODIFIED)}. These are YouTube's own pages, so they are the final word if anything here differs.</p></section>` : ''}
  </article>
  ${related.length ? `<section class="related"><h2>Keep reading</h2><div class="post-grid">${related.map(x => card(x, root)).join('')}</div></section>` : ''}
</main>` + foot(root);
  fs.writeFileSync(path.join(ROOT, 'blog', p.slug, 'index.html'), page);
}

function card(p, root) {
  return `<a class="post-card" href="${root}blog/${p.slug}/"><span class="eyebrow">${esc(p.category)}</span><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p><span class="meta">${fmtDate(p.date)} &middot; Tool: ${esc(p.toolName)}</span></a>`;
}

// ---- index ----
{
  const root = '../';
  const url = SITE + 'blog/';
  const title = 'Blog - Practical YouTube Guides for Creators';
  const desc = 'Plain-English guides that go with each free Creator Toolkit tool: thumbnails, transcripts, keywords, chapters, revenue, subscribe links and more. Checked against YouTube\'s own help pages.';
  const ld = [
    { '@context': 'https://schema.org', '@type': 'Blog', name: `${NAME} Blog`, url, description: desc, publisher: orgLd, blogPost: posts.map(p => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}blog/${p.slug}/`, datePublished: p.date })) },
    { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: posts.map((p, n) => ({ '@type': 'ListItem', position: n + 1, url: `${SITE}blog/${p.slug}/`, name: p.title })) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: NAME, item: SITE }, { '@type': 'ListItem', position: 2, name: 'Blog', item: url }] }
  ];
  fs.writeFileSync(path.join(ROOT, 'blog', 'index.html'), head({ title: `${title} | ${NAME}`, description: desc, url, type: 'website', image: SITE + 'assets/og/default.png', ld }, root) + `
<main class="blog-main">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="${root}">${NAME}</a><span>/</span><span aria-current="page">Blog</span></nav>
  <section class="blog-hero">
    <p class="eyebrow">The Creator Toolkit blog</p>
    <h1>Practical YouTube guides, one for every free tool.</h1>
    <p class="lede">Short, honest articles that explain what each tool does, how to use it well and where it stops. Each one is checked against YouTube's own help pages and has a "Copy for LLM" button if you want to talk it over with an AI assistant.</p>
  </section>
  <section class="post-grid" aria-label="All articles">
${posts.map(p => card(p, root)).join('\n')}
  </section>
</main>` + foot(root));
}

// ---- feeds & crawler files ----
const rssDate = d => new Date(d + 'T09:00:00Z').toUTCString();
fs.writeFileSync(path.join(ROOT, 'feed.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${NAME} Blog</title>
<link>${SITE}blog/</link>
<description>Practical YouTube guides for creators, one for each free tool.</description>
<language>en</language>
<lastBuildDate>${rssDate(MODIFIED)}</lastBuildDate>
<atom:link href="${SITE}feed.xml" rel="self" type="application/rss+xml"/>
${posts.map(p => `<item><title>${esc(p.title)}</title><link>${SITE}blog/${p.slug}/</link><guid isPermaLink="true">${SITE}blog/${p.slug}/</guid><pubDate>${rssDate(p.date)}</pubDate><description>${esc(p.description)}</description></item>`).join('\n')}
</channel></rss>
`);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITE}</loc><lastmod>${MODIFIED}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
<url><loc>${SITE}blog/</loc><lastmod>${MODIFIED}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
${posts.map(p => `<url><loc>${SITE}blog/${p.slug}/</loc><lastmod>${MODIFIED}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /open/\n\nSitemap: ${SITE}sitemap.xml\n`);
fs.writeFileSync(path.join(ROOT, 'llms.txt'), `# ${NAME}

> Free, no-sign-up tools for YouTube creators (thumbnail grabber, transcript download, channel stats, keyword suggestions, title analyzer, thumbnail A/B preview, revenue estimator, chapters, upload planner, CC footage finder, app link maker, subscribe link generator, public video stats, tags extractor) plus plain-English guides for each one. Not affiliated with YouTube or Google.

Every article has a clean Markdown version at the same URL with /index.md at the end. Facts are checked against YouTube's public help pages; each article lists its sources.

## Tools
- [${NAME} (all tools)](${SITE}): the free tools, all in one page

## Guides
${posts.map(p => `- [${p.title}](${SITE}blog/${p.slug}/index.md): ${p.description}`).join('\n')}

## Optional
- [Blog index](${SITE}blog/)
- [RSS feed](${SITE}feed.xml)
- [Full text of all guides](${SITE}llms-full.txt)
- [Source code (MIT)](https://github.com/devanasolver/youtube-creator-toolkit)
`);
fs.writeFileSync(path.join(ROOT, 'llms-full.txt'), `# ${NAME} - all guides\n\n` + full.join('\n\n====\n\n') + '\n');
console.log(`built ${posts.length} posts`);
