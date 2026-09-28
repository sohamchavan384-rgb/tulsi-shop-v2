import { isTrueish } from './isTrueish.js';
export const isCi = ()=>isTrueish(process.env.CI) || // Travis CI, CircleCI, Gitlab CI, Appveyor, CodeShip
    isTrueish(process.env.CONTINUOUS_INTEGRATION) || // Travis CI
    isTrueish(process.env.BUILD_NUMBER) // Jenkins, TeamCity
;

//# sourceMappingURL=isCi.js.map