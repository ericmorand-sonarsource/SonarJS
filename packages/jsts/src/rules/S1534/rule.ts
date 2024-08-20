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
// https://sonarsource.github.io/rspec/#/rspec/S1534/javascript

import { Rule } from 'eslint';
import { e } from '../core';
import { t } from '../typescript-eslint';
import { rules as reactRules } from 'eslint-plugin-react';
import { generateMeta, mergeRules } from '../helpers';
import { decorate } from './decorator';
import rspecMeta from './meta.json';

const noDupeKeysRule = decorate(e['no-dupe-keys']);
const noDupeClassMembersRule = t['no-dupe-class-members'];
const jsxNoDuplicatePropsRule = reactRules['jsx-no-duplicate-props'];

export const rule: Rule.RuleModule = {
  meta: generateMeta(rspecMeta as Rule.RuleMetaData, {
    hasSuggestions: true,
    messages: {
      ...noDupeKeysRule.meta!.messages,
      ...noDupeClassMembersRule.meta!.messages,
      ...jsxNoDuplicatePropsRule.meta!.messages,
    },
    schema: jsxNoDuplicatePropsRule.schema, // the other 2 rules have no options
  }),
  create(context: Rule.RuleContext) {
    const noDupeKeysListener: Rule.RuleListener = noDupeKeysRule.create(context);
    const noDupeClassMembersListener: Rule.RuleListener = noDupeClassMembersRule.create(context);
    const jsxNoDuplicatePropsListener: Rule.RuleListener = jsxNoDuplicatePropsRule.create(context);

    return mergeRules(noDupeKeysListener, noDupeClassMembersListener, jsxNoDuplicatePropsListener);
  },
};
