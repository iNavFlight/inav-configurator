/**
 * Module resolve hook that adds `.js` to relative specifiers without an
 * extension. App modules import each other like './elevationFetch' because
 * Vite resolves those at build time; bare Node does not, so tests need this
 * hook to load the application modules unmodified.
 */

export async function resolve(specifier, context, nextResolve) {
    const name = specifier.split('/').pop();
    if (specifier.startsWith('.') && !name.includes('.')) {
        return nextResolve(specifier + '.js', context);
    }
    return nextResolve(specifier, context);
}
