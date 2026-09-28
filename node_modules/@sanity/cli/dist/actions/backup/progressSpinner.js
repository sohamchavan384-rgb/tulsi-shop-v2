import { spinner } from '@sanity/cli-core/ux';
import prettyMs from 'pretty-ms';
export const newProgress = (startStep)=>{
    let spin = spinner(startStep).start();
    let lastProgress = {
        step: startStep
    };
    let start = Date.now();
    const print = (progress)=>{
        const elapsed = prettyMs(Date.now() - start);
        spin.text = progress.current && progress.current > 0 && progress.total && progress.total > 0 ? `${progress.step} (${progress.current}/${progress.total}) [${elapsed}]` : `${progress.step} [${elapsed}]`;
    };
    return {
        fail: ()=>{
            spin.fail();
            start = Date.now();
        },
        set: (progress)=>{
            if (progress.step !== lastProgress.step) {
                print(lastProgress); // Print the last progress before moving on
                spin.succeed();
                spin = spinner(progress.step).start();
                start = Date.now();
            } else if (progress.step === lastProgress.step && progress.update) {
                print(progress);
            }
            lastProgress = progress;
        },
        succeed: ()=>{
            spin.succeed();
            start = Date.now();
        },
        update: (progress)=>{
            print(progress);
            lastProgress = progress;
        }
    };
};

//# sourceMappingURL=progressSpinner.js.map