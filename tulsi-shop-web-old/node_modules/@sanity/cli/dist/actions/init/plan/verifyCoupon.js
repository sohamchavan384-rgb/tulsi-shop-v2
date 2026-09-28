import { confirm } from '@sanity/cli-core/ux';
import { isHttpError } from '@sanity/client';
import { getPlanIdFromCoupon } from '../../../services/plans.js';
import { InitError } from '../initError.js';
export async function verifyCoupon(intendedCoupon, unattended, output, trace) {
    try {
        const planId = await getPlanIdFromCoupon(intendedCoupon);
        output.log(`Coupon "${intendedCoupon}" validated!\n`);
        return planId;
    } catch (err) {
        if (!isHttpError(err) || err.statusCode !== 404) {
            const message = err instanceof Error ? err.message : `${err}`;
            throw new InitError(`Unable to validate coupon, please try again later:\n\n${message}`, 1);
        }
        const useDefaultPlan = unattended || await confirm({
            default: true,
            message: `Coupon "${intendedCoupon}" is not available, use default plan instead?`
        });
        if (unattended) {
            output.warn(`Coupon "${intendedCoupon}" is not available - using default plan`);
        }
        trace.log({
            coupon: intendedCoupon,
            selectedOption: useDefaultPlan ? 'yes' : 'no',
            step: 'useDefaultPlanCoupon'
        });
        if (useDefaultPlan) {
            output.log('Using default plan.');
            return undefined;
        }
        throw new InitError(`Coupon "${intendedCoupon}" does not exist`, 1);
    }
}

//# sourceMappingURL=verifyCoupon.js.map