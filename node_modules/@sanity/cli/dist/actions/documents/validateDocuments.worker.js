import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { Readable } from 'node:stream';
import { workerData as _workerData, isMainThread, parentPort } from 'node:worker_threads';
import { getStudioWorkspaces, getWorkspace, resolveLocalPackage } from '@sanity/cli-core';
import { createClient } from '@sanity/client';
import { WorkerChannelReporter } from '@sanity/worker-channels';
import pMap from 'p-map';
import { checkDocumentAvailability, exportDocuments, getDocumentCount } from '../../services/documents.js';
import { extractDocumentsFromNdjsonOrTarball } from '../../util/extractDocumentsFromNdjsonOrTarball.js';
import { DOCUMENT_VALIDATION_TIMEOUT, getReferenceIds, isValidId, levelValues, MAX_VALIDATION_CONCURRENCY, REFERENCE_INTEGRITY_BATCH_SIZE, shouldIncludeDocument } from '../../util/validation/validateDocumentsUtils.js';
const { clientConfig, dataset, level, maxCustomValidationConcurrency, maxFetchConcurrency, ndjsonFilePath, projectId, studioHost, workDir, workspace: workspaceName } = _workerData;
if (isMainThread || !parentPort) {
    throw new Error('This module must be run as a worker thread');
}
const report = WorkerChannelReporter.from(parentPort);
// eslint-disable-next-line n/no-unsupported-features/node-builtins
async function* readerToGenerator(reader) {
    while(true){
        const { done, value } = await reader.read();
        if (value) yield value;
        if (done) return;
    }
}
await main();
process.exit();
async function loadWorkspace() {
    const workspaces = await getStudioWorkspaces(workDir);
    const workspace = getWorkspace(workspaces, workspaceName);
    const resolvedDataset = dataset || workspace.dataset;
    const resolvedProjectId = projectId || workspace.projectId;
    const client = createClient({
        ...clientConfig,
        dataset: resolvedDataset,
        projectId: resolvedProjectId,
        requestTagPrefix: 'sanity.cli.validate'
    }).config({
        apiVersion: 'v2021-03-25'
    });
    report.event.loadedWorkspace({
        basePath: workspace.basePath,
        dataset: workspace.dataset,
        name: workspace.name,
        projectId: workspace.projectId
    });
    return {
        client,
        dataset: resolvedDataset,
        projectId: resolvedProjectId,
        workspace
    };
}
async function downloadFromExport({ dataset: datasetName, projectId: projId }) {
    const documentCount = await getDocumentCount({
        dataset: datasetName,
        projectId: projId
    });
    report.event.loadedDocumentCount({
        documentCount
    });
    const response = await exportDocuments({
        dataset: datasetName,
        projectId: projId
    });
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Could not get reader from response body.');
    let downloadedCount = 0;
    const referencedIds = new Set();
    const documentIds = new Set();
    const lines = readline.createInterface({
        input: Readable.from(readerToGenerator(reader))
    });
    // Note: we stream the export to a file and then re-read from that file to
    // make this less memory intensive.
    // this is a similar pattern to the import/export CLI commands
    const slugDate = new Date().toISOString().replaceAll(/[^a-z0-9]/gi, '-').toLowerCase();
    const tempOutputFile = path.join(os.tmpdir(), `sanity-validate-${slugDate}.ndjson`);
    const outputStream = fs.createWriteStream(tempOutputFile);
    for await (const line of lines){
        const document = JSON.parse(line);
        if (shouldIncludeDocument(document)) {
            documentIds.add(document._id);
            for (const referenceId of getReferenceIds(document)){
                referencedIds.add(referenceId);
            }
            outputStream.write(`${line}\n`);
        }
        downloadedCount++;
        report.stream.exportProgress.emit({
            documentCount,
            downloadedCount
        });
    }
    await new Promise((resolve, reject)=>outputStream.close((err)=>err ? reject(err) : resolve()));
    report.stream.exportProgress.end();
    report.event.exportFinished({
        totalDocumentsToValidate: documentIds.size
    });
    const getDocuments = ()=>extractDocumentsFromNdjsonOrTarball(fs.createReadStream(tempOutputFile));
    return {
        cleanup: ()=>fs.promises.rm(tempOutputFile),
        documentIds,
        getDocuments,
        referencedIds
    };
}
async function downloadFromFile(filePath) {
    const referencedIds = new Set();
    const documentIds = new Set();
    const getDocuments = ()=>extractDocumentsFromNdjsonOrTarball(fs.createReadStream(filePath));
    for await (const document of getDocuments()){
        if (shouldIncludeDocument(document)) {
            documentIds.add(document._id);
            for (const referenceId of getReferenceIds(document)){
                referencedIds.add(referenceId);
            }
        }
    }
    report.event.exportFinished({
        totalDocumentsToValidate: documentIds.size
    });
    return {
        cleanup: undefined,
        documentIds,
        getDocuments,
        referencedIds
    };
}
async function checkReferenceExistence({ dataset: datasetName, documentIds, projectId: projId, referencedIds: _referencedIds }) {
    const existingIds = new Set(documentIds);
    const idsToCheck = [
        ..._referencedIds
    ].filter((id)=>!existingIds.has(id) && isValidId(id)).toSorted();
    const batches = [];
    for(let i = 0; i < idsToCheck.length; i += REFERENCE_INTEGRITY_BATCH_SIZE){
        batches.push(idsToCheck.slice(i, i + REFERENCE_INTEGRITY_BATCH_SIZE));
    }
    for (const batch of batches){
        const { omitted } = await checkDocumentAvailability({
            dataset: datasetName,
            documentIds: batch,
            projectId: projId
        });
        const omittedIds = {};
        for (const item of omitted){
            omittedIds[item.id] = item.reason;
        }
        for (const id of batch){
            // unless the document ID is in the `omitted` object explictly due to
            // the reason `'existence'`, then it should exist
            if (omittedIds[id] !== 'existence') {
                existingIds.add(id);
            }
        }
    }
    report.event.loadedReferenceIntegrity();
    return {
        existingIds
    };
}
async function main() {
    let cleanupDownloadedDocuments;
    try {
        const { client, dataset: datasetName, projectId: projId, workspace } = await loadWorkspace();
        const { cleanup, documentIds, getDocuments, referencedIds } = ndjsonFilePath ? await downloadFromFile(ndjsonFilePath) : await downloadFromExport({
            dataset: datasetName,
            projectId: projId
        });
        cleanupDownloadedDocuments = cleanup;
        const { existingIds } = await checkReferenceExistence({
            dataset: datasetName,
            documentIds,
            projectId: projId,
            referencedIds
        });
        const getClient = (options)=>client.withConfig(options);
        const getDocumentExists = ({ id })=>Promise.resolve(existingIds.has(id));
        const getLevel = (markers)=>{
            let foundWarning = false;
            for (const marker of markers){
                if (marker.level === 'error') return 'error';
                if (marker.level === 'warning') foundWarning = true;
            }
            if (foundWarning) return 'warning';
            return 'info';
        };
        let validatedCount = 0;
        const validate = async (document)=>{
            let markers;
            try {
                const timeout = Symbol('timeout');
                const { validateDocument } = await resolveLocalPackage('sanity', workDir);
                const result = await Promise.race([
                    validateDocument({
                        document,
                        environment: 'cli',
                        getClient,
                        getDocumentExists,
                        maxCustomValidationConcurrency,
                        maxFetchConcurrency,
                        workspace
                    }),
                    new Promise((resolve)=>setTimeout(()=>resolve(timeout), DOCUMENT_VALIDATION_TIMEOUT))
                ]);
                if (result === timeout) {
                    throw new Error(`Document '${document._id}' failed to validate within ${DOCUMENT_VALIDATION_TIMEOUT}ms.`);
                }
                markers = result// filter out unwanted levels
                .filter((marker)=>{
                    const markerValue = levelValues[marker.level];
                    const flagLevelValue = levelValues[level] ?? levelValues.info;
                    return markerValue <= flagLevelValue;
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                const message = `Exception occurred while validating value: ${errorMessage}`;
                markers = [
                    {
                        level: 'error',
                        message,
                        path: []
                    }
                ];
            }
            validatedCount++;
            const intentUrl = studioHost && `${studioHost}${path.resolve(workspace.basePath, `/intent/edit/id=${encodeURIComponent(document._id)};type=${encodeURIComponent(document._type)}`)}`;
            report.stream.validation.emit({
                documentId: document._id,
                documentType: document._type,
                ...intentUrl && {
                    intentUrl
                },
                level: getLevel(markers),
                markers,
                revision: document._rev,
                validatedCount
            });
        };
        await pMap(getDocuments(), validate, {
            concurrency: MAX_VALIDATION_CONCURRENCY
        });
        report.stream.validation.end();
    } finally{
        await cleanupDownloadedDocuments?.();
    }
}

//# sourceMappingURL=validateDocuments.worker.js.map