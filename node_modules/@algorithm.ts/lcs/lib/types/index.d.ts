/**
 * Find a least lexicographical match for the longest common subsequence.
 *
 * The returned value is an tuple array (called `pairs`), where each element (pair=[i,j]) indicates
 * that the i-th element of the first sequence is paired with the j-th element of the second
 * sequence.
 *
 * @param N1
 * @param N2
 * @param equals
 * @returns
 * @see https://me.guanghechen.com/post/algorithm/lcs/
 */
declare function lcs_dp(N1: number, N2: number, equals: (x: number, y: number) => boolean): Array<[number, number]>;

/**
 * Find the length of the longest common subsequence.
 *
 * @param N1
 * @param N2
 * @param equals
 * @returns
 * @see https://me.guanghechen.com/post/algorithm/lcs/
 */
declare function lcs_size_dp(N1: number, N2: number, equals: (x: number, y: number) => boolean): number;

/**
 * Find a least lexicographical match for the longest common subsequence.
 */
declare function lcs_myers(N1: number, N2: number, equals: (x: number, y: number) => boolean): Array<[number, number]>;

/**
 * Find a least lexicographical match for the longest common subsequence.
 */
declare function lcs_size_myers(N1: number, N2: number, equals: (x: number, y: number) => boolean): number;

/**
 * Find a least match for the longest common subsequence.
 *
 * @param N1
 * @param N2
 * @param equals
 * @returns
 * @see http://www.xmailserver.org/diff2.pdf An O(ND) Difference Algorithm and Its Variations
 */
declare function lcs_myers_linear_space(N1: number, N2: number, equals: (x: number, y: number) => boolean): Array<[number, number]>;

/**
 * Find a least lexicographical match for the longest common subsequence.
 */
declare function lcs_size_myers_linear_space(N1: number, N2: number, equals: (x: number, y: number) => boolean): number;

/**
 * Find Longest Common Subsequence with Dynamic Programming.
 *
 * Let dp(i,j) denote the longest common subsequence of {a1,a2,...,ai} and {b1,b2,...,bj}, it is not
 * difficult to derive the transition equation:
 *
 *    dp(i,j) = max{dp(i-1,j), dp(i,j-1), dp(i-1,j-1)+f(i,j)}, where f(i,j) = 1 if ai=aj else 0
 *
 * ### Optimization
 *
 * let dp(j) denote the longest common subsequence of {a1, a2, ...aN1} and {b1, b2, ...,bj}, then we
 * should update in reverse order, similar to the rolling array of the knapsack problem.
 *
 * The time complexity is still O(N1xN2), but the space complexity is optimized to O(N2) now.
 *
 * @param N1
 * @param N2
 * @param equals
 * @returns
 * @see https://me.guanghechen.com/post/algorithm/lcs/
 */
declare function findLCSOfEveryRightPrefix(N1: number, N2: number, equals: (x: number, y: number) => boolean): number[] | null;

export { findLCSOfEveryRightPrefix, lcs_size_dp as findLengthOfLCS, lcs_dp as findMinLexicographicalLCS, lcs_dp, lcs_myers, lcs_myers_linear_space, lcs_size_dp, lcs_size_myers, lcs_size_myers_linear_space };
