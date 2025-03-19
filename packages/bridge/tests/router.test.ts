/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2025 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the Sonar Source-Available License Version 1, as published by SonarSource SA.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the Sonar Source-Available License for more details.
 *
 * You should have received a copy of the Sonar Source-Available License
 * along with this program; if not, see https://sonarsource.com/license/ssal/
 */
import path from 'path';
import { Response, Request, Server, ServerFactory, start } from '../src/server.js';
import { request } from './tools/index.js';
import fs from 'fs';
import { describe, before, after, it, type Mock } from 'node:test';
import { expect } from 'expect';

import { rule as S5362 } from '../../css/src/rules/S5362/index.js';
import assert from 'node:assert';
import { toUnixPath } from '../../shared/src/helpers/files.js';
import { ProjectAnalysisInput } from '../../jsts/src/analysis/projectAnalysis/projectAnalysis.js';
import { deserializeProtobuf } from '../../jsts/src/parsers/ast.js';
import { createAndSaveProgram } from '../../jsts/src/program/program.js';
import { RuleConfig } from '../../jsts/src/linter/config/rule-config.js';
import { createWorker } from '../../shared/src/helpers/worker.js';
import http from 'http';
import { Writable } from 'node:stream';

const createFetch = () => {
  let handlers: {
    close: () => void;
    error: (error: Error) => void;
    listening: () => void;
    request: (request: Request, response: Response) => void;
  } = {
    close: () => {},
    error: () => {},
    listening: () => {},
    request: () => {},
  };

  let app: {
    request: http.IncomingMessage;
    response: http.ServerResponse;
  } = null;

  const createServerFactory = (): ServerFactory => {
    return application => {
      app = application;

      let listening: boolean = false;

      const server: Server = {
        get listening() {
          return listening;
        },
        closeAllConnections: () => {},
        close: () => {
          handlers.close();
        },
        address: () => {
          return {
            port: 8000,
          };
        },
        listen: (port, host) => {
          console.log(`LISTEN ${host}:${port}...`);

          listening = true;
        },
        on: (eventName: string, handler) => {
          console.log('ON', eventName);

          if (eventName === 'request') {
            console.log('REQUEST HANDLER IS', handler);
          }

          if (eventName === 'listening') {
            // we are immediately ready, let us announce it
            handler();
          }

          handlers[eventName] = handler;

          return server;
        },
        // emit(eventName: string, ...args: Array<any>) {
        //   console.log("EMIT", eventName, args);
        //
        //   if (eventName === "error") {
        //     handlers.error(args[0]);
        //   }
        //   if (eventName === "close") {
        //     handlers.close();
        //   }
        //   else if (eventName === "listening") {
        //     handlers.listening();
        //   }
        //   else if (eventName === "request") {
        //     handlers.request(args[0], args[1]);
        //   }
        // }
      };

      return server;
    };
  };

  return {
    createServerFactory,
    fetch: (url: string, data: any): Promise<Response> => {
      return new Promise(async resolve => {
        const headers: Response['headers'] = new Map();

        let responseData: any = null;
        let responseBuffer = Buffer.from('');

        const writable = new Writable({
          write(chunk, encoding, callback) {
            responseBuffer = Buffer.concat([responseBuffer, Buffer.from(chunk, encoding)]);

            callback();
          },
        });

        writable.on('finish', () => {
          console.log('FINISHHHHHHHHHHHHHHHH');

          resolve(response);
        });

        const response = {
          headers,
          formData: () => {
            return {} as any;
          },
          setHeader: (name, value) => {
            headers.set(name, value);
          },
          send: data => {
            console.log('SEND', url, data);

            responseData = data;

            resolve(response);
          },
          text: () => {
            return JSON.stringify(responseData);
          },
          writable,
        };

        await (app.request as any).app(
          {
            url,
            body: JSON.parse(data.body),
            method: data.method,
          },
          response,
        );
      });
    },
  };
};

const { fetch, createServerFactory } = createFetch();

describe('router', () => {
  const fixtures = path.join(import.meta.dirname, 'fixtures', 'router');
  const port = 0;
  let closePromise: Promise<void>;
  const workerPath = path.join(import.meta.dirname, '..', '..', '..', 'server.mjs');

  const serverFactory = createServerFactory();

  before(async () => {
    const worker = createWorker(workerPath);
    const { serverClosed } = await start(serverFactory, port, '127.0.0.1');
    closePromise = serverClosed;
  });

  after(async () => {
    await request(fetch, '/close', 'POST');
    //We need to await the server close promise, as the http server still needs to be up to finish the response of the /close request.
    await closePromise;
  });

  it('should route /analyze-project requests', async () => {
    const filePath = toUnixPath(path.join(fixtures, 'file.ts'));
    const payload: ProjectAnalysisInput = {
      rules: [
        {
          key: 'S4621',
          configurations: [],
          fileTypeTargets: ['MAIN'],
          language: 'ts',
          analysisModes: ['DEFAULT'],
        },
      ],
      baseDir: fixtures,
      files: {
        [filePath]: { fileType: 'MAIN', filePath },
      },
    };

    const response = await request(fetch, '/analyze-project', 'POST', payload);

    console.log('>>>>>>> RESPONSE', response, JSON.parse(response.text()));

    const {
      files: {
        [filePath]: {
          issues: [issue],
        },
      },
    } = JSON.parse(response.text());
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'S4621',
        line: 1,
        column: 28,
        endLine: 1,
        endColumn: 35,
        message: `Remove this duplicated type or replace with another one.`,
      }),
    );
  });

  it('should route /analyze-css requests', async () => {
    const filePath = path.join(fixtures, 'file.css');
    const rules = [{ key: S5362.ruleName, configurations: [] }];
    const data = { filePath, rules };
    const response = await request(fetch, '/analyze-css', 'POST', data);
    expect(JSON.parse(response.text())).toEqual({
      issues: [
        {
          ruleId: S5362.ruleName,
          line: 1,
          column: 6,
          message: `Fix this malformed 'calc' expression.`,
        },
      ],
    });
  });

  it('should route /analyze-jsts requests', async () => {
    await requestInitLinter(fetch, [
      {
        key: 'S6325',
        configurations: [],
        fileTypeTargets: ['MAIN'],
        language: 'js',
        analysisModes: ['DEFAULT'],
      },
      {
        key: 'S4621',
        configurations: [],
        fileTypeTargets: ['MAIN'],
        language: 'ts',
        analysisModes: ['DEFAULT'],
      },
    ]);
    let filePath = path.join(fixtures, 'file.js');
    let fileType = 'MAIN';
    let data: any = { filePath, fileType, tsConfigs: [] };
    let response = await request(fetch, '/analyze-jsts', 'POST', data);

    console.log('============== analyze-jsts', response);

    let {
      issues: [issue],
    } = JSON.parse(response.formData().get('json')?.toString());
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'S6325',
        line: 1,
        column: 0,
        endLine: 1,
        endColumn: 17,
        message: `Use a regular expression literal instead of the 'RegExp' constructor.`,
      }),
    );
    expect(response.formData().get('ast')).toBeInstanceOf(Blob);
    const ast = response.formData().get('ast') as File;
    const buffer = Buffer.from(await ast.arrayBuffer());
    const protoMessage = deserializeProtobuf(buffer);
    expect(protoMessage.type).toEqual(0);
    expect(protoMessage.program.body).toHaveLength(1);
    expect(protoMessage.program.body[0].expressionStatement.expression.newExpression).toBeDefined();

    filePath = path.join(fixtures, 'file.ts');
    fileType = 'MAIN';
    data = { filePath, fileType, tsConfigs: [path.join(fixtures, 'tsconfig.json')], skipAst: true };
    response = await request(fetch, '/analyze-jsts', 'POST', data);
    ({
      issues: [issue],
    } = JSON.parse(response.text()));
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'S4621',
        line: 1,
        column: 28,
        endLine: 1,
        endColumn: 35,
        message: `Remove this duplicated type or replace with another one.`,
      }),
    );
  });

  it('should route /analyze-with-program requests', async () => {
    await requestInitLinter(fetch, [
      {
        key: 'S4621',
        configurations: [],
        fileTypeTargets: ['MAIN'],
        language: 'ts',
        analysisModes: ['DEFAULT'],
      },
    ]);
    const filePath = path.join(fixtures, 'file.ts');
    const fileType = 'MAIN';
    const tsConfig = path.join(fixtures, 'tsconfig.json');
    const { programId } = JSON.parse(
      (await request(fetch, '/create-program', 'POST', { tsConfig })).text(),
    );
    const data = { filePath, fileType, programId, skipAst: true };
    const response = await request(fetch, '/analyze-jsts', 'POST', data);
    const {
      issues: [issue],
    } = JSON.parse(response.text());
    expect(issue).toEqual(
      expect.objectContaining({
        ruleId: 'S4621',
        line: 1,
        column: 28,
        endLine: 1,
        endColumn: 35,
        message: `Remove this duplicated type or replace with another one.`,
      }),
    );
  });

  it('should route /analyze-yaml requests', async () => {
    await requestInitLinter(fetch, [
      {
        key: 'S3923',
        configurations: [],
        fileTypeTargets: ['MAIN'],
        language: 'js',
        analysisModes: ['DEFAULT'],
      },
    ]);
    const filePath = path.join(fixtures, 'file.yaml');
    const filePathWithLambda = path.join(fixtures, 'file-SomeLambdaFunction.yaml');
    const data = { filePath };
    const response = await request(fetch, '/analyze-yaml', 'POST', data);
    const {
      issues: [issue],
    } = JSON.parse(response.text());
    expect(issue).toEqual({
      ruleId: 'S3923',
      language: 'js',
      line: 8,
      column: 17,
      endLine: 8,
      endColumn: 46,
      message:
        "Remove this conditional structure or edit its code blocks so that they're not all the same.",
      quickFixes: [],
      secondaryLocations: [],
      ruleESLintKeys: ['no-all-duplicated-branches'],
      filePath: filePathWithLambda,
    });
  });

  it('should route /analyze-html requests', async () => {
    await requestInitLinter(fetch, [
      {
        key: 'S3923',
        configurations: [],
        fileTypeTargets: ['MAIN'],
        language: 'js',
        analysisModes: ['DEFAULT'],
      },
    ]);
    const filePath = path.join(fixtures, 'file.html');
    const data = { filePath };
    const response = await request(fetch, '/analyze-html', 'POST', data);
    const {
      issues: [issue],
    } = JSON.parse(response.text());
    expect(issue).toEqual({
      ruleId: 'S3923',
      language: 'js',
      line: 10,
      column: 2,
      endLine: 10,
      endColumn: 31,
      message:
        "Remove this conditional structure or edit its code blocks so that they're not all the same.",
      quickFixes: [],
      secondaryLocations: [],
      ruleESLintKeys: ['no-all-duplicated-branches'],
      filePath,
    });
  });

  it('should route /create-program requests', async () => {
    const tsConfig = path.join(fixtures, 'tsconfig.json');
    const data = { tsConfig };
    const response = await request(fetch, '/create-program', 'POST', data);
    const programId = Number(JSON.parse(response.text()).programId);
    expect(programId).toBeDefined();
    expect(programId).toBeGreaterThan(0);
  });

  it('should forward /create-program failures', async ({ mock }) => {
    console.error = mock.fn(console.error);
    const tsConfig = path.join(fixtures, 'malformed.json');
    const data = { tsConfig };
    const response = await request(fetch, '/create-program', 'POST', data);
    const { error } = JSON.parse(response.text());
    expect(error).toBeDefined();
    assert((console.error as Mock<typeof console.error>).mock.calls.length > 0);
  });

  it('should route /delete-program requests', async () => {
    const tsConfig = path.join(fixtures, 'tsconfig.json');
    const { programId } = createAndSaveProgram(tsConfig);
    const data = { programId };
    const response = await request(fetch, '/delete-program', 'POST', data);
    expect(response.text()).toEqual('OK!');
  });

  it('should route /init-linter requests', async () => {
    const data = { rules: [], environments: [], globals: [] };
    const response = await request(fetch, '/init-linter', 'POST', data);
    expect(response.text()).toEqual('OK!');
  });

  it('should route /new-tsconfig requests', async () => {
    const data = {};
    const response = await request(fetch, '/new-tsconfig', 'POST', data);
    expect(response.text()).toEqual('OK!');
  });

  it('should route /status requests', async () => {
    const response = await request(fetch, '/status', 'GET');
    expect(response.text()).toEqual('OK!');
  });

  it('should route /tsconfig-files requests', async () => {
    const file = toUnixPath(path.join(fixtures, 'file.ts'));

    const tsconfig1 = path.join(fixtures, 'tsconfig.json');
    const response1 = await request(fetch, '/tsconfig-files', 'POST', {
      tsConfig: tsconfig1,
    });
    expect(JSON.parse(response1.text())).toEqual({
      files: [file],
      projectReferences: [],
    });

    const tsconfig2 = path.join(fixtures, 'tsconfig-references.json');
    const response2 = await request(fetch, '/tsconfig-files', 'POST', {
      tsConfig: tsconfig2,
    });
    expect(JSON.parse(response2.text())).toEqual({
      files: [file],
      projectReferences: [toUnixPath(tsconfig1)],
    });
  });

  it('should forward /tsconfig-files failures', async ({ mock }) => {
    console.error = mock.fn(console.error);
    const tsConfig = toUnixPath(path.join(fixtures, 'malformed.json'));
    const data = { tsConfig };
    const response = await request(fetch, '/tsconfig-files', 'POST', data);
    const { error } = JSON.parse(response.text());
    expect(error).toContain("']' expected.");
    assert((console.error as Mock<typeof console.error>).mock.calls.length > 0);
  });

  it('should write tsconfig.json file', async () => {
    const response = await request(fetch, '/create-tsconfig-file', 'POST', {
      include: ['/path/to/project/**/*'],
    });
    const json = JSON.parse(response.text());
    expect(json).toBeTruthy();
    expect(json.filename).toBeTruthy();
    expect(fs.existsSync(json.filename)).toBe(true);
  });

  it('should return empty get-telemetry on fresh server', async () => {
    const response = await request(fetch, '/get-telemetry', 'GET');
    const json = JSON.parse(response.text());
    expect(json).toEqual({ dependencies: [] });
  });
});

function requestInitLinter(fetch: any, rules: RuleConfig[]) {
  const config = { rules };
  return request(fetch, '/init-linter', 'POST', config);
}
