export async function shouldAutoResolveDependencies(resource) {
    if ('autoResolveDeps' in resource && typeof resource.autoResolveDeps === 'boolean') {
        return resource.autoResolveDeps;
    }
    // otherwise hydrate is the default
    return true;
}
