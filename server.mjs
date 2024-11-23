#!/usr/bin/env node
import path from 'path';
import * as context from './lib/shared/src/helpers/context.js';
import { pathToFileURL } from 'node:url';
import { getContext } from './lib/shared/src/helpers/context.js';

import { Worker } from 'node:worker_threads';
import { createHeartBeat } from './lib/bridge/src/heartbeat.js';

/**
 * This script expects following arguments
 *
 * port - port number on which server.mjs should listen
 * host - host address on which server.mjs should listen
 * workDir - working directory from SonarQube API
 * shouldUseTypeScriptParserForJS - whether TypeScript parser should be used for JS code (default true, can be set to false in case of perf issues)
 * sonarlint - when running in SonarLint (used to not compute metrics, highlighting, etc)
 * bundles - ; or : delimited paths to additional rule bundles
 */

const port = process.argv[2];
const heartbeatPort = process.argv[3];
const workDir = process.argv[4];
const shouldUseTypeScriptParserForJS = process.argv[5] !== 'false';
const sonarlint = process.argv[6] === 'true';
const debugMemory = process.argv[7] === 'true';
const scriptDirectoryPath = process.argv[8];

let bundles = [];
if (process.argv[9]) {
  bundles = process.argv[9].split(path.delimiter).map(bundleDir => pathToFileURL(bundleDir).href);
}

context.setContext({ workDir, shouldUseTypeScriptParserForJS, sonarlint, debugMemory, bundles });

const worker = new Worker(path.join(scriptDirectoryPath, 'worker.js'), {
  workerData: {
    context: getContext(),
    port,
  },
});

const start = createHeartBeat(heartbeatPort, worker);

start();
