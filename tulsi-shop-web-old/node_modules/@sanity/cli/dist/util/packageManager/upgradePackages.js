import { getYarnMajorVersion } from '@sanity/cli-core/package-manager';
import { execa } from 'execa';
import { getPartialEnvWithNpmPath } from './packageManagerChoice.js';
/**
 * @internal
 */ export async function upgradePackages(options, context) {
    const { packageManager, packages } = options;
    const { output, workDir } = context;
    const execOptions = {
        cwd: workDir,
        encoding: 'utf8',
        env: getPartialEnvWithNpmPath(workDir),
        stdio: 'inherit'
    };
    const upgradePackageArgs = packages.map((pkg)=>pkg.join('@'));
    let result;
    switch(packageManager){
        case 'bun':
            {
                const bunArgs = [
                    'update',
                    ...upgradePackageArgs
                ];
                output.log(`Running 'bun ${bunArgs.join(' ')}'`);
                result = await execa('bun', bunArgs, execOptions);
                break;
            }
        case 'manual':
            {
                output.log(`Manual installation selected - run 'npm upgrade ${upgradePackageArgs.join(' ')}' or equivalent`);
                break;
            }
        case 'npm':
            {
                const npmArgs = [
                    'install',
                    '--legacy-peer-deps',
                    ...upgradePackageArgs
                ];
                output.log(`Running 'npm ${npmArgs.join(' ')}'`);
                result = await execa('npm', npmArgs, execOptions);
                break;
            }
        case 'pnpm':
            {
                const pnpmArgs = [
                    'upgrade',
                    ...upgradePackageArgs
                ];
                output.log(`Running 'pnpm ${pnpmArgs.join(' ')}'`);
                result = await execa('pnpm', pnpmArgs, execOptions);
                break;
            }
        case 'yarn':
            {
                const yarnMajor = getYarnMajorVersion();
                const upgradeCmd = yarnMajor !== undefined && yarnMajor >= 2 ? 'up' : 'upgrade';
                const yarnArgs = [
                    upgradeCmd,
                    ...upgradePackageArgs
                ];
                output.log(`Running 'yarn ${yarnArgs.join(' ')}'`);
                result = await execa('yarn', yarnArgs, execOptions);
                break;
            }
    }
    if (result?.exitCode || result?.failed) {
        throw new Error('Package upgrade failed');
    }
}

//# sourceMappingURL=upgradePackages.js.map