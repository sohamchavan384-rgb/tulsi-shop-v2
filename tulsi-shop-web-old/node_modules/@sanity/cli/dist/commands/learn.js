import { Command } from '@oclif/core';
import open from 'open';
export class LearnCommand extends Command {
    static description = 'Open Sanity Learn in your browser';
    static flags = {};
    async run() {
        // Parse to ensure no invalid flags are passed
        await this.parse(LearnCommand);
        const url = 'https://www.sanity.io/learn';
        this.log(`Opening ${url}`);
        await open(url);
    }
}

//# sourceMappingURL=learn.js.map