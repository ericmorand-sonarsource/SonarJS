'use strict';
/*
 * SonarQube JavaScript Plugin
 * Copyright (C) 2011-2024 SonarSource SA
 * mailto:info AT sonarsource DOT com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program; if not, write to the Free Software Foundation,
 * Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
// https://sonarsource.github.io/rspec/#/rspec/S5332/javascript
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var url_1 = require('url');
var helpers_1 = require('../helpers');
var cdk_1 = require('../helpers/aws/cdk');
var INSECURE_PROTOCOLS = ['http://', 'ftp://', 'telnet://'];
var LOOPBACK_PATTERN = /localhost|127(?:\.\d+){0,2}\.\d+$|\/\/(?:0*:)*?:?0*1$/;
var EXCEPTION_FULL_HOSTS = [
  'www.w3.org',
  'xml.apache.org',
  'schemas.xmlsoap.org',
  'schemas.openxmlformats.org',
  'rdfs.org',
  'purl.org',
  'xmlns.com',
  'schemas.google.com',
  'a9.com',
  'ns.adobe.com',
  'ltsc.ieee.org',
  'docbook.org',
  'graphml.graphdrawing.org',
  'json-schema.org',
];
var EXCEPTION_TOP_HOSTS = [/(.*\.)?example\.com$/, /(.*\.)?example\.org$/, /(.*\.)?test\.com$/];
exports.rule = {
  meta: {
    messages: {
      insecureProtocol: 'Using {{protocol}} protocol is insecure. Use {{alternative}} instead.',
    },
  },
  create: function (context) {
    function checkNodemailer(callExpression) {
      var firstArg = callExpression.arguments.length > 0 ? callExpression.arguments[0] : null;
      if (!firstArg) {
        return;
      }
      var firstArgValue = (0, helpers_1.getValueOfExpression)(
        context,
        firstArg,
        'ObjectExpression',
      );
      var ses = (0, helpers_1.getObjectExpressionProperty)(firstArgValue, 'SES');
      if (ses && usesSesCommunication(ses)) {
        return;
      }
      var secure = (0, helpers_1.getObjectExpressionProperty)(firstArgValue, 'secure');
      if (secure && (secure.value.type !== 'Literal' || secure.value.raw !== 'false')) {
        return;
      }
      var requireTls = (0, helpers_1.getObjectExpressionProperty)(firstArgValue, 'requireTLS');
      if (requireTls && (requireTls.value.type !== 'Literal' || requireTls.value.raw !== 'false')) {
        return;
      }
      var port = (0, helpers_1.getObjectExpressionProperty)(firstArgValue, 'port');
      if (port && (port.value.type !== 'Literal' || port.value.raw === '465')) {
        return;
      }
      context.report(__assign({ node: callExpression.callee }, getMessageAndData('http')));
    }
    function usesSesCommunication(sesProperty) {
      var _a;
      var configuration = (0, helpers_1.getValueOfExpression)(
        context,
        sesProperty.value,
        'ObjectExpression',
      );
      if (!configuration) {
        return false;
      }
      var ses = (0, helpers_1.getValueOfExpression)(
        context,
        (_a = (0, helpers_1.getObjectExpressionProperty)(configuration, 'ses')) === null ||
          _a === void 0
          ? void 0
          : _a.value,
        'NewExpression',
      );
      if (
        !ses ||
        (0, cdk_1.normalizeFQN)((0, helpers_1.getFullyQualifiedName)(context, ses)) !==
          '@aws_sdk.client_ses.SES'
      ) {
        return false;
      }
      var aws = (0, helpers_1.getObjectExpressionProperty)(configuration, 'aws');
      if (
        !aws ||
        (0, cdk_1.normalizeFQN)((0, helpers_1.getFullyQualifiedName)(context, aws.value)) !==
          '@aws_sdk.client_ses'
      ) {
        return false;
      }
      return true;
    }
    function checkCallToFtp(callExpression) {
      if (
        callExpression.callee.type === 'MemberExpression' &&
        callExpression.callee.property.type === 'Identifier' &&
        callExpression.callee.property.name === 'connect'
      ) {
        var newExpression = (0, helpers_1.getValueOfExpression)(
          context,
          callExpression.callee.object,
          'NewExpression',
        );
        if (
          !!newExpression &&
          (0, helpers_1.getFullyQualifiedName)(context, newExpression.callee) === 'ftp'
        ) {
          var firstArg = callExpression.arguments.length > 0 ? callExpression.arguments[0] : null;
          if (!firstArg) {
            return;
          }
          var firstArgValue = (0, helpers_1.getValueOfExpression)(
            context,
            firstArg,
            'ObjectExpression',
          );
          var secure = (0, helpers_1.getObjectExpressionProperty)(firstArgValue, 'secure');
          if (secure && secure.value.type === 'Literal' && secure.value.raw === 'false') {
            context.report(__assign({ node: callExpression.callee }, getMessageAndData('ftp')));
          }
        }
      }
    }
    function checkCallToRequire(callExpression) {
      if (callExpression.callee.type === 'Identifier' && callExpression.callee.name === 'require') {
        var firstArg = callExpression.arguments.length > 0 ? callExpression.arguments[0] : null;
        if (
          firstArg &&
          firstArg.type === 'Literal' &&
          typeof firstArg.value === 'string' &&
          firstArg.value === 'telnet-client'
        ) {
          context.report(__assign({ node: firstArg }, getMessageAndData('telnet')));
        }
      }
    }
    function isExceptionUrl(value) {
      if (INSECURE_PROTOCOLS.includes(value)) {
        var parent_1 = (0, helpers_1.getParent)(context);
        return !(
          (parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.type) ===
            'BinaryExpression' && parent_1.operator === '+'
        );
      }
      return hasExceptionHost(value);
    }
    function hasExceptionHost(value) {
      var url;
      try {
        url = new url_1.URL(value);
      } catch (err) {
        return false;
      }
      var host = url.hostname;
      return (
        host.length === 0 ||
        LOOPBACK_PATTERN.test(host) ||
        EXCEPTION_FULL_HOSTS.some(function (exception) {
          return exception === host;
        }) ||
        EXCEPTION_TOP_HOSTS.some(function (exception) {
          return exception.test(host);
        })
      );
    }
    return {
      Literal: function (node) {
        var literal = node;
        if (typeof literal.value === 'string') {
          var value_1 = literal.value.trim().toLocaleLowerCase();
          var insecure = INSECURE_PROTOCOLS.find(function (protocol) {
            return value_1.startsWith(protocol);
          });
          if (insecure && !isExceptionUrl(value_1)) {
            var protocol = insecure.substring(0, insecure.indexOf(':'));
            context.report(__assign(__assign({}, getMessageAndData(protocol)), { node: node }));
          }
        }
      },
      CallExpression: function (node) {
        var callExpression = node;
        if (
          (0, helpers_1.getFullyQualifiedName)(context, callExpression) ===
          'nodemailer.createTransport'
        ) {
          checkNodemailer(callExpression);
        }
        checkCallToFtp(callExpression);
        checkCallToRequire(callExpression);
      },
      ImportDeclaration: function (node) {
        var importDeclaration = node;
        if (
          typeof importDeclaration.source.value === 'string' &&
          importDeclaration.source.value === 'telnet-client'
        ) {
          context.report(__assign({ node: importDeclaration.source }, getMessageAndData('telnet')));
        }
      },
    };
  },
};
function getMessageAndData(protocol) {
  var alternative;
  switch (protocol) {
    case 'http':
      alternative = 'https';
      break;
    case 'ftp':
      alternative = 'sftp, scp or ftps';
      break;
    default:
      alternative = 'ssh';
  }
  return { messageId: 'insecureProtocol', data: { protocol: protocol, alternative: alternative } };
}
