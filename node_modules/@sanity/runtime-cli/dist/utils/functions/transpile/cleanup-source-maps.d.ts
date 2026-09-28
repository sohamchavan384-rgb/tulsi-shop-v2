/**
 * "Clean up" source maps by removing absolute paths and making paths relative to the
 * _input_ (eg source) rather than the _output_ (eg bundle) directory. Note that this
 * process is not critical since the source content is inlined, but it helps with
 * debugging to have (approximate) paths to the original source files.
 *
 * @param inputDir - The directory where the source files are located
 * @param outputDir - The directory where the bundled files are located
 */
export declare function cleanupSourceMaps(inputDir: string, outputDir: string): Promise<void>;
