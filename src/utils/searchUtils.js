
// --- Helpers for Fuzzy Search ---
export const levenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

export const isFuzzyMatch = (text, queryTerm) => {
    if (!text || !queryTerm) return false;
    const cleanText = text.toLowerCase();
    const term = queryTerm.toLowerCase();

    // 1. Exact substring match
    if (cleanText.includes(term)) return true;

    // 2. Fuzzy match against words
    if (term.length > 3) {
        const words = cleanText.split(/[\s-]+/); // Split by space or dash
        return words.some(word => {
            // Allow more typos for longer words
            const maxDist = word.length > 6 ? 3 : 2;
            return levenshteinDistance(term, word) <= maxDist;
        });
    }

    return false;
};

// Check if ALL terms in query match the text (or part of it)
export const smartSearchMatch = (text, fullQuery) => {
    if (!fullQuery) return true;
    const terms = fullQuery.toLowerCase().split(' ').filter(t => t.length > 0);
    if (terms.length === 0) return true;
    return terms.every(term => isFuzzyMatch(text, term));
};

export const getGlobalSearchScore = (beerName, fullQuery, allActiveEmissions = []) => {
    if (!fullQuery || fullQuery.length < 2) return 0;
    const normalizedQuery = fullQuery.toLowerCase();

    // 1. Direct match or Smart match (Full query matches beer name)
    if (smartSearchMatch(beerName, normalizedQuery)) return 100;

    // 2. Partial match: At least one term matches beer name
    const terms = normalizedQuery.split(' ').filter(t => t.length > 0);
    const someTermMatchesBeer = terms.some(t => isFuzzyMatch(beerName, t));

    // 3. Emission match: At least one term matches an emission
    const someTermMatchesEmission = terms.some(t =>
        allActiveEmissions.some(e => isFuzzyMatch(e, t))
    );

    if (someTermMatchesBeer && someTermMatchesEmission) return 90;
    if (someTermMatchesBeer) return 80;
    if (someTermMatchesEmission) return 70;

    return 0;
};
