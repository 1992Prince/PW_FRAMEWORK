// src/utils/ApiRequestBuilder.js
//
// Fluent Interface pattern demo.
// Each method returns `this` so calls can be chained before a final async .send().
// This is 100% synchronous setup — only .send() is async.

export class ApiRequestBuilder {
    constructor(request) {
        this._request = request; // Playwright APIRequestContext
        this._method  = '';      // user must set via .get() / .post() / .put() / .delete()
        this._url     = '';
        this._headers = {};
        this._body    = null;
    }

    // ── HTTP method setters ───────────────────────────────────────────────

    get(url)    { this._method = 'get';    this._url = url; return this; }
    post(url)   { this._method = 'post';   this._url = url; return this; }
    put(url)    { this._method = 'put';    this._url = url; return this; }
    delete(url) { this._method = 'delete'; this._url = url; return this; }

    // ── Optional config — pass full objects, no key/value complexity ──────

    withHeaders(headersObj) { this._headers = headersObj; return this; }
    withBody(bodyObj)       { this._body    = bodyObj;    return this; }

    // ── Terminal method — only async call in the entire chain ─────────────

    async send() {
        const options = { headers: this._headers };
        if (this._body) options.data = this._body;

        return await this._request[this._method](this._url, options);
    }
}

