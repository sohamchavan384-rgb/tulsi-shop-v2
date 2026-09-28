'use strict';

function lcs_dp(N1, N2, equals) {
    if (N1 <= 0 || N2 <= 0)
        return [];
    const dp = new Array(N1);
    for (let i = 0; i < N1; ++i)
        dp[i] = new Array(N2);
    {
        let first_i = 0;
        let first_j = 0;
        while (first_i < N1 && equals(first_i, 0) === false)
            ++first_i;
        while (first_j < N2 && equals(0, first_j) === false)
            ++first_j;
        dp[0].fill(0, 0, first_j);
        dp[0].fill(1, first_j, N2);
        for (let i = 0; i < first_i; ++i)
            dp[i][0] = 0;
        for (let i = first_i; i < N1; ++i)
            dp[i][0] = 1;
    }
    for (let i = 1; i < N1; ++i) {
        for (let j = 1; j < N2; ++j) {
            if (equals(i, j)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            }
            else {
                const x = dp[i][j - 1];
                const y = dp[i - 1][j];
                dp[i][j] = x < y ? y : x;
            }
        }
    }
    const N = dp[N1 - 1][N2 - 1];
    const firsts = new Array(N + 1);
    for (let i = 0, j = N2 - 1, n = 1; n <= N; ++n) {
        while (dp[i][j] < n)
            ++i;
        firsts[n] = i;
    }
    const pairs = new Array(N);
    for (let j = N2 - 1, n = N; n > 0; --n) {
        let i = firsts[n];
        while (dp[i][j] < n)
            ++i;
        while (j >= 0 && dp[i][j] === n)
            --j;
        pairs[n - 1] = [i, j + 1];
    }
    return pairs;
}

function lcs_size_dp(N1, N2, equals) {
    if (N1 <= 0 || N2 <= 0)
        return 0;
    const dp = new Array(N2);
    {
        let first_j = 0;
        while (first_j < N2 && equals(0, first_j) === false)
            ++first_j;
        dp.fill(0, 0, first_j);
        dp.fill(1, first_j, N2);
    }
    for (let i = 1; i < N1; ++i) {
        let prev_ij = dp[0];
        if (dp[0] === 0 && equals(i, 0))
            dp[0] = 1;
        for (let j = 1; j < N2; ++j) {
            const z = dp[j];
            if (equals(i, j))
                dp[j] = prev_ij + 1;
            else {
                const y = dp[j - 1];
                dp[j] = y < z ? z : y;
            }
            prev_ij = z;
        }
    }
    return dp[N2 - 1];
}

function lcs_myers(N1, N2, equals) {
    if (N1 <= 0 || N2 <= 0)
        return [];
    const fx0 = fast_forward(0, 0);
    if (fx0 === N1 || fx0 === N2) {
        const answers = new Array(fx0);
        for (let i = 0; i < fx0; ++i)
            answers[i] = [i, i];
        return answers;
    }
    const K = N1 - N2;
    const L = N1 + N2 + 1;
    const diagonals = new Array(L);
    diagonals[0] = fx0;
    const parents = new Map();
    const count = (N1 + N2 - lcs()) / 2;
    const answers = new Array(count);
    for (let x = N1, y = N2, i = count; x > 0 && y > 0;) {
        const dir = parents.get(y * N1 + x);
        if (dir === -1)
            --x;
        else if (dir === 1)
            --y;
        else
            answers[--i] = [--x, --y];
    }
    return answers;
    function lcs() {
        for (let step = 1;; ++step) {
            const parity = (step & 1);
            const kl = -(step < N2 ? step : N2);
            const kr = step < N1 ? step : N1;
            if (step <= N1) {
                const fk = step;
                diagonals[fk < 0 ? fk + L : fk] = fast_forward(fk, step);
            }
            if (step <= N2) {
                const fk = -step;
                diagonals[fk < 0 ? fk + L : fk] = fast_forward(fk, 0);
            }
            for (let k = -parity; k >= kl; k -= 2) {
                const x = forward(kl, kr, k);
                if (x === N1 && k === K)
                    return step;
            }
            for (let k = parity; k <= kr; k += 2) {
                const x = forward(kl, kr, k);
                if (x === N1 && k === K)
                    return step;
            }
        }
    }
    function fast_forward(k, x0) {
        let x = x0;
        for (let y = x - k; x < N1 && y < N2 && equals(x, y); ++x, ++y)
            ;
        return x;
    }
    function forward(kl, kr, k) {
        const kid = k < 0 ? k + L : k;
        let x = diagonals[kid];
        if (x < N1) {
            if (k > kl) {
                const kl = k - 1;
                const xl = diagonals[kl < 0 ? kl + L : kl];
                if (x <= xl && xl < N1) {
                    x = xl + 1;
                    const p = (x - k) * N1 + x;
                    parents.set(p, -1);
                }
            }
            if (k < kr) {
                const kr = k + 1;
                const xr = diagonals[kr < 0 ? kr + L : kr];
                if (x < xr) {
                    x = xr;
                    const p = (x - k) * N1 + x;
                    parents.set(p, 1);
                }
            }
            for (let y = x - k; x < N1 && y < N2 && equals(x, y); ++x, ++y)
                ;
            diagonals[kid] = x;
        }
        return x;
    }
}

function lcs_size_myers(N1, N2, equals) {
    if (N1 <= 0 || N2 <= 0)
        return 0;
    let x0 = 0;
    for (let y0 = 0; x0 < N1 && y0 < N2 && equals(x0, y0); ++x0, ++y0)
        ;
    if (x0 === N1 || x0 === N2)
        return N1 < N2 ? N1 : N2;
    const K = N1 - N2;
    const L = N1 + N2 + 1;
    const diagonals = new Array(L);
    diagonals[0] = x0;
    for (let step = 1;; ++step) {
        const parity = (step & 1);
        const kl = -(step < N2 ? step : N2);
        const kr = step < N1 ? step : N1;
        if (step <= N2) {
            let x = 0;
            for (let y = step; x < N1 && y < N2 && equals(x, y); ++x, ++y)
                ;
            const k = -step;
            diagonals[k + L] = x;
        }
        if (step <= N1) {
            let x = step;
            for (let y = 0; x < N1 && y < N2 && equals(x, y); ++x, ++y)
                ;
            const k = step;
            diagonals[k] = x;
        }
        for (let k = -parity; k >= kl; k -= 2) {
            const x = forward(kl, kr, k);
            if (x === N1 && k === K)
                return (N1 + N2 - step) / 2;
        }
        for (let k = parity; k <= kr; k += 2) {
            const x = forward(kl, kr, k);
            if (x === N1 && k === K)
                return (N1 + N2 - step) / 2;
        }
    }
    function forward(kl, kr, k) {
        const kid = k < 0 ? k + L : k;
        let x = diagonals[kid];
        if (x < N1) {
            if (k > kl) {
                const kl = k - 1;
                const xl = diagonals[kl < 0 ? kl + L : kl];
                if (x <= xl && xl < N1)
                    x = xl + 1;
            }
            if (k < kr) {
                const kr = k + 1;
                const xr = diagonals[kr < 0 ? kr + L : kr];
                if (x < xr)
                    x = xr;
            }
            for (let y = x - k; x < N1 && y < N2 && equals(x, y); ++x, ++y)
                ;
            diagonals[kid] = x;
        }
        return x;
    }
}

function lcs_myers_linear_space(N1, N2, equals) {
    if (N1 <= 0 || N2 <= 0)
        return [];
    const L = N1 + N2 + 1;
    const diagonals_forward = new Array(L);
    const diagonals_backward = new Array(L);
    const answers = [];
    lcs(0, 0, N1, N2);
    return answers;
    function lcs(Xl, Yl, Xr, Yr) {
        if (Xl >= Xr || Yl >= Yr)
            return;
        if (Xl + 1 === Xr) {
            let y = Yl;
            while (y < Yr && !equals(Xl, y))
                ++y;
            if (y < Yr)
                answers.push([Xl, y]);
            return;
        }
        if (Yl + 1 === Yr) {
            let x = Xl;
            while (x < Xr && !equals(x, Yl))
                ++x;
            if (x < Xr)
                answers.push([x, Yl]);
            return;
        }
        const [mu, mv, step1, step2] = find_middle(Xl, Yl, Xr, Yr);
        let u = mu;
        let v = mv;
        if (u - Xl + v - Yl > step1)
            lcs(Xl, Yl, u, v);
        for (; u < Xr && v < Yr && equals(u, v); ++u, ++v)
            answers.push([u, v]);
        if (Xr - u + Yr - v > step2)
            lcs(u, v, Xr, Yr);
    }
    function find_middle(Xl, Yl, Xr, Yr) {
        const M = Xr - Xl;
        const N = Yr - Yl;
        const FK0 = Xl - Yl;
        const BK0 = Xr - Yr;
        const fx0 = fast_forward(Xr, Yr, FK0, Xl);
        const fy0 = fx0 - FK0;
        if (fx0 === Xr || fy0 === Yr)
            return [Xl, Yl, 0, Xr - fx0 + Yr - fy0];
        const bx0 = fast_backward(Xl, Yl, BK0, Xr);
        const by0 = bx0 - BK0;
        if (bx0 === Xl || by0 === Yl)
            return [bx0, by0, bx0 - Xl + by0 - Yl, 0];
        diagonals_forward.fill(-1);
        diagonals_backward.fill(L + 1);
        diagonals_forward[FK0 < 0 ? FK0 + L : FK0] = fx0;
        diagonals_backward[BK0 < 0 ? BK0 + L : BK0] = bx0;
        for (let step = 1;; ++step) {
            const parity = (step & 1);
            const fkl = FK0 - (step < N ? step : N);
            const fkr = FK0 + (step < M ? step : M);
            const bkl = BK0 - (step < M ? step : M);
            const bkr = BK0 + (step < N ? step : N);
            if (step <= N) {
                const fk = FK0 - step;
                diagonals_forward[fk < 0 ? fk + L : fk] = fast_forward(Xr, Yr, fk, Xl);
                const bk = BK0 + step;
                diagonals_backward[bk < 0 ? bk + L : bk] = fast_backward(Xl, Yl, bk, Xr);
            }
            if (step <= M) {
                const fk = FK0 + step;
                diagonals_forward[fk < 0 ? fk + L : fk] = fast_forward(Xr, Yr, fk, Xl + step);
                const bk = BK0 - step;
                diagonals_backward[bk < 0 ? bk + L : bk] = fast_backward(Xl, Yl, bk, Xr - step);
            }
            for (let k = FK0 - parity; k >= fkl; k -= 2) {
                const x = forward(Xr, Yr, fkl, fkr, k);
                if (x !== -1)
                    return [x, x - k, step, step - 1];
            }
            for (let k = FK0 + parity; k <= fkr; k += 2) {
                const x = forward(Xr, Yr, fkl, fkr, k);
                if (x !== -1)
                    return [x, x - k, step, step - 1];
            }
            for (let k = BK0 - parity; k >= bkl; k -= 2) {
                const x = backward(Xl, Yl, bkl, bkr, k);
                if (x !== -1)
                    return [x, x - k, step, step];
            }
            for (let k = BK0 + parity; k <= bkr; k += 2) {
                const x = backward(Xl, Yl, bkl, bkr, k);
                if (x !== -1)
                    return [x, x - k, step, step];
            }
        }
    }
    function fast_forward(Xr, Yr, k, x0) {
        let x = x0;
        for (let y = x - k; x < Xr && y < Yr && equals(x, y); ++x, ++y)
            ;
        return x;
    }
    function fast_backward(Xl, Yl, k, x0) {
        let x = x0 - 1;
        for (let y = x - k; x >= Xl && y >= Yl && equals(x, y); --x, --y)
            ;
        return x + 1;
    }
    function forward(Xr, Yr, Kl, Kr, k) {
        const kid = k < 0 ? k + L : k;
        let x = diagonals_forward[kid];
        if (x < Xr) {
            if (k > Kl) {
                const kl = k - 1;
                const xl = diagonals_forward[kl < 0 ? kl + L : kl];
                if (x <= xl && xl < Xr)
                    x = xl + 1;
            }
            if (k < Kr) {
                const kr = k + 1;
                const xr = diagonals_forward[kr < 0 ? kr + L : kr];
                if (x < xr)
                    x = xr;
            }
            diagonals_forward[kid] = fast_forward(Xr, Yr, k, x);
        }
        return diagonals_forward[kid] >= diagonals_backward[kid] ? x : -1;
    }
    function backward(Xl, Yl, Kl, Kr, k) {
        const kid = k < 0 ? k + L : k;
        let x = diagonals_backward[kid];
        if (x > Xl) {
            if (k > Kl) {
                const kl = k - 1;
                const xl = diagonals_backward[kl < 0 ? kl + L : kl];
                if (x > xl)
                    x = xl;
            }
            if (k < Kr) {
                const kr = k + 1;
                const xr = diagonals_backward[kr < 0 ? kr + L : kr];
                if (x >= xr && xr > Xl)
                    x = xr - 1;
            }
            x = diagonals_backward[kid] = fast_backward(Xl, Yl, k, x);
        }
        return diagonals_forward[kid] >= diagonals_backward[kid] ? x : -1;
    }
}

function lcs_size_myers_linear_space(N1, N2, equals) {
    if (N1 <= 0 || N2 <= 0)
        return 0;
    const L = N1 + N2 + 1;
    const FK0 = 0;
    const BK0 = N1 - N2;
    const fx0 = fast_forward(FK0, 0);
    if (fx0 === N1 || fx0 - FK0 === N2)
        return N1 < N2 ? N1 : N2;
    const bx0 = fast_backward(BK0, N1);
    if (bx0 === 0 || bx0 - BK0 === 0)
        return N1 < N2 ? N1 : N2;
    const diagonals_forward = new Array(L);
    const diagonals_backward = new Array(L);
    diagonals_forward[FK0] = fx0;
    diagonals_backward[BK0 < 0 ? BK0 + L : BK0] = bx0;
    for (let step = 1;; ++step) {
        const parity = (step & 1);
        const fkl = FK0 - (step < N2 ? step : N2);
        const fkr = FK0 + (step < N1 ? step : N1);
        const bkl = BK0 - (step < N1 ? step : N1);
        const bkr = BK0 + (step < N2 ? step : N2);
        if (step <= N1) {
            const fk = FK0 + step;
            diagonals_forward[fk < 0 ? fk + L : fk] = fast_forward(fk, step);
        }
        if (step <= N2) {
            const fk = FK0 - step;
            diagonals_forward[fk < 0 ? fk + L : fk] = fast_forward(fk, 0);
        }
        for (let k = FK0 - parity; k >= fkl; k -= 2) {
            if (forward(fkl, fkr, k)) {
                const s = step + step - 1;
                return (N1 + N2 - s) / 2;
            }
        }
        for (let k = FK0 + parity; k <= fkr; k += 2) {
            if (forward(fkl, fkr, k)) {
                const s = step + step - 1;
                return (N1 + N2 - s) / 2;
            }
        }
        if (step <= N1) {
            const bk = BK0 - step;
            diagonals_backward[bk < 0 ? bk + L : bk] = fast_backward(bk, N1 - step);
        }
        if (step <= N2) {
            const bk = BK0 + step;
            diagonals_backward[bk < 0 ? bk + L : bk] = fast_backward(bk, N1);
        }
        for (let k = BK0 - parity; k >= bkl; k -= 2) {
            if (backward(bkl, bkr, k)) {
                const s = step + step;
                return (N1 + N2 - s) / 2;
            }
        }
        for (let k = BK0 + parity; k <= bkr; k += 2) {
            if (backward(bkl, bkr, k)) {
                const s = step + step;
                return (N1 + N2 - s) / 2;
            }
        }
    }
    function fast_forward(k, x0) {
        let x = x0;
        for (let y = x - k; x < N1 && y < N2 && equals(x, y); ++x, ++y)
            ;
        return x;
    }
    function fast_backward(k, x0) {
        let x = x0 - 1;
        for (let y = x - k; x >= 0 && y >= 0 && equals(x, y); --x, --y)
            ;
        return x + 1;
    }
    function forward(kl, kr, k) {
        const kid = k < 0 ? k + L : k;
        let x = diagonals_forward[kid];
        if (x < N1) {
            if (k > kl) {
                const kl = k - 1;
                const xl = diagonals_forward[kl < 0 ? kl + L : kl];
                if (x <= xl && xl < N1)
                    x = xl + 1;
            }
            if (k < kr) {
                const kr = k + 1;
                const xr = diagonals_forward[kr < 0 ? kr + L : kr];
                if (x < xr)
                    x = xr;
            }
            diagonals_forward[kid] = fast_forward(k, x);
        }
        return diagonals_forward[kid] >= diagonals_backward[kid];
    }
    function backward(kl, kr, k) {
        const kid = k < 0 ? k + L : k;
        let x = diagonals_backward[kid];
        if (x > 0) {
            if (k > kl) {
                const kl = k - 1;
                const xl = diagonals_backward[kl < 0 ? kl + L : kl];
                if (x > xl)
                    x = xl;
            }
            if (k < kr) {
                const kr = k + 1;
                const xr = diagonals_backward[kr < 0 ? kr + L : kr];
                if (x >= xr && xr > 0)
                    x = xr - 1;
            }
            diagonals_backward[kid] = fast_backward(k, x);
        }
        return diagonals_forward[kid] >= diagonals_backward[kid];
    }
}

function findLCSOfEveryRightPrefix(N1, N2, equals) {
    if (N1 <= 0 || N2 <= 0)
        return null;
    const dp = new Array(N2);
    {
        let first_j = 0;
        while (first_j < N2 && equals(0, first_j) === false)
            ++first_j;
        dp.fill(0, 0, first_j);
        dp.fill(1, first_j, N2);
    }
    for (let i = 1; i < N1; ++i) {
        let prev_ij = dp[0];
        if (dp[0] === 0 && equals(i, 0))
            dp[0] = 1;
        for (let j = 1; j < N2; ++j) {
            const z = dp[j];
            if (equals(i, j))
                dp[j] = prev_ij + 1;
            else {
                const y = dp[j - 1];
                dp[j] = y < z ? z : y;
            }
            prev_ij = z;
        }
    }
    return dp;
}

exports.findLCSOfEveryRightPrefix = findLCSOfEveryRightPrefix;
exports.findLengthOfLCS = lcs_size_dp;
exports.findMinLexicographicalLCS = lcs_dp;
exports.lcs_dp = lcs_dp;
exports.lcs_myers = lcs_myers;
exports.lcs_myers_linear_space = lcs_myers_linear_space;
exports.lcs_size_dp = lcs_size_dp;
exports.lcs_size_myers = lcs_size_myers;
exports.lcs_size_myers_linear_space = lcs_size_myers_linear_space;
