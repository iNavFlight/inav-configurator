/**
 * Encodes a JS module's source as a data: URL importable by Node's ESM
 * resolver, for inline test stubs that must behave like real modules.
 * encodeURIComponent leaves ' ( ) ! * unescaped; the generated specifiers are
 * embedded in single-quoted string literals, so escape those too.
 */
export function dataModule(code) {
    const encoded = encodeURIComponent(code).replace(/['()!*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:text/javascript,' + encoded;
}
