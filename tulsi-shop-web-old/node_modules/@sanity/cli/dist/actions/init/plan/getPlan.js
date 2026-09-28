import { verifyCoupon } from './verifyCoupon.js';
import { verifyPlan } from './verifyPlan.js';
export async function getPlan(options, output, trace) {
    const intendedPlan = options.projectPlan;
    const intendedCoupon = options.coupon;
    if (intendedCoupon) {
        return verifyCoupon(intendedCoupon, options.unattended, output, trace);
    } else if (intendedPlan) {
        return verifyPlan(intendedPlan, options.unattended, output, trace);
    } else {
        return undefined;
    }
}

//# sourceMappingURL=getPlan.js.map