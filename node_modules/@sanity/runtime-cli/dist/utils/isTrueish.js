/**
 * Quick check for 'true' or '1' from env
 * @param val
 */
const isTrueish = (val) => {
    const v = (val ?? '').toLowerCase();
    return v === 'true' || parseInt(v, 10) > 0;
};
export default isTrueish;
