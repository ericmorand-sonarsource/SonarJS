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
// https://sonarsource.github.io/rspec/#/rspec/S1313/javascript
Object.defineProperty(exports, '__esModule', { value: true });
exports.rule = void 0;
var net_1 = require('net');
var netMaskRegex = /(^[^/]+)\/\d{1,3}$/;
var acceptedIpAddresses = ['255.255.255.255', '::1', '::', '0:0:0:0:0:0:0:1', '0:0:0:0:0:0:0:0'];
var ipV4Octets = 4;
var ipV4MappedToV6Prefix = '::ffff:0:';
var acceptedIpV6Starts = [
  // https://datatracker.ietf.org/doc/html/rfc3849
  '2001:db8:',
];
var acceptedIpV4Starts = [
  '127.',
  '0.',
  // avoid FP for OID http://www.oid-info.com/introduction.htm
  '2.5',
  // https://datatracker.ietf.org/doc/html/rfc5737
  '192.0.2.',
  '198.51.100.',
  '203.0.113.',
];
exports.rule = {
  meta: {
    messages: {
      checkIP: 'Make sure using a hardcoded IP address {{ip}} is safe here.',
    },
  },
  create: function (context) {
    function isException(ip) {
      return (
        acceptedIpV6Starts.some(function (prefix) {
          return ip.startsWith(prefix);
        }) ||
        acceptedIpV4Starts.some(function (prefix) {
          return ip.startsWith(ipV4MappedToV6Prefix + prefix) || ip.startsWith(prefix);
        }) ||
        acceptedIpAddresses.includes(ip)
      );
    }
    function isIPV4OctalOrHex(ip) {
      var digits = ip.split('.');
      if (digits.length !== ipV4Octets) {
        return false;
      }
      var decimalDigits = [];
      for (var _i = 0, digits_1 = digits; _i < digits_1.length; _i++) {
        var digit = digits_1[_i];
        if (digit.match(/^0[0-7]*$/)) {
          decimalDigits.push(parseInt(digit, 8));
        } else if (digit.match(/^0[xX][0-9a-fA-F]+$/)) {
          decimalDigits.push(parseInt(digit, 16));
        } else {
          return false;
        }
      }
      var convertedIp = ''
        .concat(decimalDigits[0], '.')
        .concat(decimalDigits[1], '.')
        .concat(decimalDigits[2], '.')
        .concat(decimalDigits[3]);
      return !isException(convertedIp) && (0, net_1.isIP)(convertedIp) !== 0;
    }
    return {
      Literal: function (node) {
        var value = node.value;
        if (typeof value !== 'string') {
          return;
        }
        var ip = value;
        var result = value.match(netMaskRegex);
        if (result) {
          ip = result[1];
        }
        if ((!isException(ip) && (0, net_1.isIP)(ip) !== 0) || isIPV4OctalOrHex(ip)) {
          context.report({
            node: node,
            messageId: 'checkIP',
            data: {
              ip: value,
            },
          });
        }
      },
    };
  },
};
