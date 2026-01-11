// Polyfill fetch for youtube-caption-scraper
if (!globalThis.fetch) {
  const undici = require('undici');
  globalThis.fetch = undici.fetch;
  globalThis.Headers = undici.Headers;
  globalThis.Request = undici.Request;
  globalThis.Response = undici.Response;
  globalThis.FormData = undici.FormData;
  globalThis.AbortController = undici.AbortController;
}
