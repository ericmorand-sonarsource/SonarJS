'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.isRequiredParserServices = void 0;
function isRequiredParserServices(services) {
  // see https://github.com/typescript-eslint/typescript-eslint/issues/7124
  return !!(services === null || services === void 0 ? void 0 : services.program);
}
exports.isRequiredParserServices = isRequiredParserServices;
