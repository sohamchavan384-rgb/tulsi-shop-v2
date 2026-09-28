export const promiseWithResolvers = // @ts-expect-error TODO: replace with `Promise.withResolvers()` once it lands in node
Promise.withResolvers?.bind(Promise) || function promiseWithResolvers() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej)=>{
        resolve = res;
        reject = rej;
    });
    return {
        promise,
        reject,
        resolve
    };
};

//# sourceMappingURL=promiseWithResolvers.js.map