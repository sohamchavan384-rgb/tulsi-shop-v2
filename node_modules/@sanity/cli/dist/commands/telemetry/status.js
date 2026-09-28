import { SanityCommand } from '@sanity/cli-core';
import { getLearnMoreMessage } from '../../actions/telemetry/getLearnMoreMessage.js';
import { getStatusMessage } from '../../actions/telemetry/getStatusMessage.js';
import { resolveConsent } from '../../actions/telemetry/resolveConsent.js';
export class Status extends SanityCommand {
    static description = 'Check telemetry status for your account';
    static examples = [
        {
            command: '<%= config.bin %> telemetry <%= command.id %>',
            description: 'Check telemetry status for your account'
        }
    ];
    static flags = {};
    async run() {
        // Parse to ensure no invalid flags are passed
        await this.parse(Status);
        const consentInfo = await resolveConsent();
        const statusMessage = getStatusMessage(consentInfo);
        const learnMoreMessage = getLearnMoreMessage(consentInfo.status);
        this.output.log(statusMessage);
        this.output.log(`\n${learnMoreMessage}`);
    }
}

//# sourceMappingURL=status.js.map