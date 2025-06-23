// Convert TypeScript to JavaScript for bolt.new compatibility
export function createPageUrl(pageName) {
    return '/' + pageName.toLowerCase().replace(/ /g, '-');
}