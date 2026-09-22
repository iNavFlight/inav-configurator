/**
 * Module resolve hook that adds `with { type: 'json' }` to every resolved .json
 * specifier. The app imports migration profiles as plain JSON because Vite
 * resolves those at build time; bare Node requires the import attribute, so
 * tests need this hook to load the application modules unmodified.
 */

export async function resolve(specifier, context, nextResolve) {
    const result = await nextResolve(specifier, context);
    if (result.url.endsWith('.json')) {
        return { ...result, importAttributes: { type: 'json' } };
    }
    return result;
}
