import { Command } from '@oclif/core';
import open from 'open';
export class DocsBrowseCommand extends Command {
    static description = 'Open Sanity docs in your browser';
    static flags = {};
    async run() {
        // Parse to ensure no invalid flags are passed
        await this.parse(DocsBrowseCommand);
        const url = 'https://www.sanity.io/docs';
        this.log(`Opening ${url}`);
        await open(url);
    }
}

//# sourceMappingURL=browse.js.map