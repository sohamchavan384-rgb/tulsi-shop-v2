import { Readable } from 'node:stream';
import { getBackupDetails } from '../../services/backup.js';
export class PaginatedGetBackupStream extends Readable {
    totalFiles = 0;
    backupId;
    cursor = '';
    datasetName;
    projectId;
    constructor(projectId, datasetName, backupId){
        super({
            objectMode: true
        });
        this.projectId = projectId;
        this.datasetName = datasetName;
        this.backupId = backupId;
    }
    async _read() {
        try {
            const data = await this.fetchNextBackupPage();
            // Set totalFiles when it's fetched for the first time
            if (this.totalFiles === 0) {
                this.totalFiles = data.totalFiles;
            }
            for (const file of data.files){
                this.push(file);
            }
            if (typeof data.nextCursor === 'string' && data.nextCursor !== '') {
                this.cursor = data.nextCursor;
            } else {
                // No more pages left to fetch.
                this.push(null);
            }
        } catch (err) {
            this.destroy(err instanceof Error ? err : new Error(String(err)));
        }
    }
    // fetchNextBackupPage fetches the next page of backed up files from the backup API.
    fetchNextBackupPage() {
        return getBackupDetails({
            backupId: this.backupId,
            datasetName: this.datasetName,
            nextCursor: this.cursor === '' ? undefined : this.cursor,
            projectId: this.projectId
        });
    }
}

//# sourceMappingURL=fetchNextBackupPage.js.map