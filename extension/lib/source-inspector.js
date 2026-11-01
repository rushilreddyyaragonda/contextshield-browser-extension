/**
 * ContextShield Source Inspector
 * Extracts available metadata and source links from a webpage.
 * Uses only data accessible through the DOM — no external requests.
 */

(function (global) {
  'use strict';

  function getMetaContent(name, attr) {
    attr = attr || 'name';
    const el = document.querySelector('meta[' + attr + '="' + name + '"]');
    return el && el.content ? el.content.trim() : null;
  }

  function getLinks(maxLinks) {
    maxLinks = maxLinks || 50;
    const anchors = document.querySelectorAll('a[href]');
    const links = [];
    const seen = {};
    const currentDomain = location.hostname.replace(/^www\./, '');

    for (const a of anchors) {
      if (links.length >= maxLinks) break;
      const href = a.href;
      if (!href || href.startsWith('javascript:') || href.startsWith('#')) continue;
      if (seen[href]) continue;
      seen[href] = true;

      let linkDomain = '';
      try {
        linkDomain = new URL(href).hostname.replace(/^www\./, '');
      } catch (e) {
        linkDomain = '';
      }

      const isSameDomain = linkDomain === currentDomain;
      const text = (a.textContent || '').trim().substring(0, 120);

      links.push({
        text: text || '(no link text)',
        url: href,
        domain: linkDomain,
        isSameDomain: isSameDomain,
        isExternal: !isSameDomain && linkDomain !== '',
      });
    }
    return links;
  }

  function extractDates(text) {
    if (!text) return [];
    const datePatterns = [
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
      /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    ];
    const dates = [];
    for (const p of datePatterns) {
      let m;
      while ((m = p.exec(text)) !== null) {
        dates.push(m[0]);
      }
    }
    return dates;
  }

  function inspectPage() {
    const title = document.title || '';
    const url = location.href;
    const canonical = getMetaContent('canonical', 'property') || getMetaContent('canonical') ||
      (document.querySelector('link[rel="canonical"]') ? document.querySelector('link[rel="canonical"]').href : null);

    const author =
      getMetaContent('author') ||
      getMetaContent('article:author', 'property') ||
      getMetaContent('author', 'itemprop') ||
      null;

    const publishedDate =
      getMetaContent('article:published_time', 'property') ||
      getMetaContent('published_time') ||
      getMetaContent('date') ||
      getMetaContent('dc.date') ||
      null;

    const modifiedDate =
      getMetaContent('article:modified_time', 'property') ||
      getMetaContent('modified_time') ||
      null;

    const description =
      getMetaContent('description') ||
      getMetaContent('og:description', 'property') ||
      null;

    const siteName =
      getMetaContent('og:site_name', 'property') ||
      null;

    const links = getLinks();

    const articleText = document.body ? document.body.innerText.substring(0, 100000) : '';
    const dates = extractDates(articleText);

    // Citation-like patterns
    const citationPatterns = [
      /\b(?:et\s+al\.?|ibid\.?|op\.?\s*cit\.?|cf\.)\b/gi,
      /\b(?:Source:|Hat\s+tip:|Via:|See:|Ref:)\s/gi,
      /\[\d+\]/g,
    ];
    const citations = [];
    for (const p of citationPatterns) {
      let m;
      while ((m = p.exec(articleText)) !== null) {
        citations.push(m[0]);
        if (citations.length >= 20) break;
      }
    }

    return {
      title: title,
      url: url,
      canonicalUrl: canonical,
      author: author,
      publishedDate: publishedDate,
      modifiedDate: modifiedDate,
      description: description,
      siteName: siteName,
      links: links,
      datesFound: dates,
      citationMarkers: citations,
      linkCount: links.length,
      externalLinkCount: links.filter(function (l) { return l.isExternal; }).length,
    };
  }

  function formatSourceSummary(meta) {
    if (!meta) return 'No source metadata available.';
    var parts = [];
    if (meta.title) parts.push('Page title: ' + meta.title);
    if (meta.author) parts.push('Author: ' + meta.author);
    if (meta.publishedDate) parts.push('Published: ' + meta.publishedDate);
    if (meta.siteName) parts.push('Site: ' + meta.siteName);
    parts.push('URL: ' + meta.url);
    parts.push('Links found: ' + meta.linkCount + ' (' + meta.externalLinkCount + ' external)');
    return parts.join('\n');
  }

  global.SourceInspector = {
    inspectPage: inspectPage,
    getLinks: getLinks,
    extractDates: extractDates,
    formatSourceSummary: formatSourceSummary,
  };
})(typeof window !== 'undefined' ? window : this);
