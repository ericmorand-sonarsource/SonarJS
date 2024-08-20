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

import fs from 'fs';
import { findParent } from './helpers';
import { PackageJson } from 'type-fest';
import { Rule } from 'eslint';
import type { TSESLint } from '@typescript-eslint/utils';
import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import { e } from './core';
import { rules as a } from 'eslint-plugin-jsx-a11y';
import { rules as r } from 'eslint-plugin-react';
import { rules as i } from 'eslint-plugin-import';

import { rule as S2376 } from './S2376'; // accessor-pairs
import { S1077 } from './S1077'; // alt-text
import { rule as S6827 } from './S6827'; // anchor-has-content
import { rule as S6844 } from './S6844'; // anchor-is-valid
import { rule as S5850 } from './S5850'; // anchor-precedence
import { rule as S3782 } from './S3782'; // argument-type
import { rule as S2234 } from './S2234'; // arguments-order
import { rule as S3513 } from './S3513'; // arguments-usage
import { rule as S3796 } from './S3796'; // array-callback-without-return
import { rule as S1528 } from './S1528'; // array-constructor
import { rule as S3524 } from './S3524'; // arrow-function-convention
import { rule as S2699 } from './S2699'; // assertions-in-tests
import { rule as S6333 } from './S6333'; // aws-apigateway-public-api
import { rule as S6329 } from './S6329'; // aws-ec2-rds-dms-public
import { rule as S6275 } from './S6275'; // aws-ec2-unencrypted-ebs-volume
import { rule as S6332 } from './S6332'; // aws-efs-unencrypted
import { rule as S6302 } from './S6302'; // aws-iam-all-privileges
import { rule as S6304 } from './S6304'; // aws-iam-all-resources-accessible
import { rule as S6317 } from './S6317'; // aws-iam-privilege-escalation
import { rule as S6270 } from './S6270'; // aws-iam-public-access
import { rule as S6308 } from './S6308'; // aws-opensearchservice-domain
import { rule as S6303 } from './S6303'; // aws-rds-unencrypted-databases
import { rule as S6321 } from './S6321'; // aws-restricted-ip-admin-access
import { rule as S6265 } from './S6265'; // aws-s3-bucket-granted-access
import { rule as S6249 } from './S6249'; // aws-s3-bucket-insecure-http
import { rule as S6281 } from './S6281'; // aws-s3-bucket-public-access
import { rule as S6245 } from './S6245'; // aws-s3-bucket-server-encryption
import { rule as S6252 } from './S6252'; // aws-s3-bucket-versioning
import { rule as S6319 } from './S6319'; // aws-sagemaker-unencrypted-notebook
import { rule as S6327 } from './S6327'; // aws-sns-unencrypted-topics
import { rule as S6330 } from './S6330'; // aws-sqs-unencrypted-queue
import { rule as S1529 } from './S1529'; // bitwise-operators
import { rule as S4798 } from './S4798'; // bool-param-default
import { rule as S1105 } from './S1105'; // brace-style
import { rule as S1472 } from './S1472'; // call-argument-line
import { rule as S5742 } from './S5742'; // certificate-transparency
import { rule as S6092 } from './S6092'; // chai-determinate-assertion
import { rule as S101 } from './S101'; // class-name
import { rule as S3525 } from './S3525'; // class-prototype
import { rule as S1523 } from './S1523'; // code-eval
import { rule as S3776 } from './S3776'; // cognitive-complexity
import { rule as S3616 } from './S3616'; // comma-or-logical-or-case
import { rule as S124 } from './S124'; // comment-regex
import { rule as S6353 } from './S6353'; // concise-regex
import { rule as S3973 } from './S3973'; // conditional-indentation
import { rule as S5757 } from './S5757'; // confidential-information-logging
import { rule as S1848 } from './S1848'; // constructor-for-side-effects
import { rule as S5693 } from './S5693'; // content-length
import { rule as S5728 } from './S5728'; // content-security-policy
import { rule as S3330 } from './S3330'; // cookie-no-httponly
import { rule as S2255 } from './S2255'; // cookies
import { rule as S5122 } from './S5122'; // cors
import { rule as S4502 } from './S4502'; // csrf
import { rule as S1541 } from './S1541'; // cyclomatic-complexity
import { rule as S3798 } from './S3798'; // declarations-in-global-scope
import { rule as S1788 } from './S1788'; // default-param-last
import { rule as S1874 } from './S1874'; // deprecation
import { rule as S3514 } from './S3514'; // destructuring-assignment-syntax
import { rule as S3403 } from './S3403'; // different-types-comparison
import { rule as S5247 } from './S5247'; // disabled-auto-escaping
import { rule as S5725 } from './S5725'; // disabled-resource-integrity
import { rule as S6080 } from './S6080'; // disabled-timeout
import { rule as S5743 } from './S5743'; // dns-prefetching
import { rule as S5869 } from './S5869'; // duplicates-in-character-class
import { rule as S126 } from './S126'; // elseif-without-else
import { rule as S5842 } from './S5842'; // empty-string-repetition
import { rule as S4787 } from './S4787'; // encryption
import { rule as S5542 } from './S5542'; // encryption-secure-mode
import { rule as S3723 } from './S3723'; // enforce-trailing-comma
import { rule as S6328 } from './S6328'; // existing-groups
import { rule as S1067 } from './S1067'; // expression-complexity
import { rule as S1451 } from './S1451'; // file-header
import { rule as S3317 } from './S3317'; // file-name-differ-from-class
import { rule as S2612 } from './S2612'; // file-permissions
import { rule as S2598 } from './S2598'; // file-uploads
import { rule as S1134 } from './S1134'; // fixme-tag
import { rule as S1535 } from './S1535'; // for-in
import { rule as S2251 } from './S2251'; // for-loop-increment-sign
import { rule as S5732 } from './S5732'; // frame-ancestors
import { rule as S1515 } from './S1515'; // function-inside-loop
import { rule as S100 } from './S100'; // function-name
import { rule as S3800 } from './S3800'; // function-return-type
import { rule as S1527 } from './S1527'; // future-reserved-words
import { rule as S3531 } from './S3531'; // generator-without-yield
import { rule as S4790 } from './S4790'; // hashing
import { rule as S5691 } from './S5691'; // hidden-files
import { rule as S6754 } from './S6754'; // hook-use-state
import { rule as S5254 } from './S5254'; // html-has-lang
import { rule as S3785 } from './S3785'; // in-operator-type-error
import { rule as S3686 } from './S3686'; // inconsistent-function-call
import { rule as S2692 } from './S2692'; // index-of-compare-to-positive-number
import { rule as S2092 } from './S2092'; // insecure-cookie
import { rule as S5659 } from './S5659'; // insecure-jwt-token
import { rule as S3415 } from './S3415'; // inverted-assertion-arguments
import { rule as S6477 } from './S6477'; // jsx-key
import { rule as S6481 } from './S6481'; // jsx-no-constructed-context-values
import { rule as S6749 } from './S6749'; // jsx-no-useless-fragment
import { rule as S6853 } from './S6853'; // label-has-associated-control
import { rule as S1439 } from './S1439'; // label-position
import { rule as S5148 } from './S5148'; // link-with-target-blank
import { rule as S1479 } from './S1479'; // max-switch-cases
import { rule as S4622 } from './S4622'; // max-union-size
import { rule as S4084 } from './S4084'; // media-has-caption
import { rule as S1994 } from './S1994'; // misplaced-loop-counter
import { rule as S1082 } from './S1082'; // mouse-events-a11y
import { rule as S134 } from './S134'; // nested-control-flow
import { rule as S2430 } from './S2430'; // new-cap
import { rule as S2999 } from './S2999'; // new-operator-misuse
import { rule as S4275 } from './S4275'; // no-accessor-field-mismatch
import { rule as S3923 } from './S3923'; // no-all-duplicated-branches
import { rule as S2871 } from './S2871'; // no-alphabetical-sort
import { rule as S6268 } from './S6268'; // no-angular-bypass-sanitization
import { rule as S2870 } from './S2870'; // no-array-delete
import { rule as S6479 } from './S6479'; // no-array-index-key
import { rule as S3579 } from './S3579'; // no-associative-arrays
import { rule as S6551 } from './S6551'; // no-base-to-string
import { rule as S2424 } from './S2424'; // no-built-in-override
import { rule as S1219 } from './S1219'; // no-case-label-in-switch
import { rule as S5332 } from './S5332'; // no-clear-text-protocols
import { rule as S6079 } from './S6079'; // no-code-after-done
import { rule as S1066 } from './S1066'; // no-collapsible-if
import { rule as S3981 } from './S3981'; // no-collection-size-mischeck
import { rule as S125 } from './S125'; // no-commented-code
import { rule as S1854 } from './S1854'; // no-dead-store
import { rule as S3001 } from './S3001'; // no-delete-var
import { rule as S6957 } from './S6957'; // no-deprecated-react
import { rule as S4621 } from './S4621'; // no-duplicate-in-composite
import { rule as S1192 } from './S1192'; // no-duplicate-string
import { rule as S1871 } from './S1871'; // no-duplicated-branches
import { rule as S4143 } from './S4143'; // no-element-overwrite
import { rule as S6019 } from './S6019'; // no-empty-after-reluctant
import { rule as S6323 } from './S6323'; // no-empty-alternatives
import { rule as S4158 } from './S4158'; // no-empty-collection
import { rule as S1186 } from './S1186'; // no-empty-function
import { rule as S6331 } from './S6331'; // no-empty-group
import { rule as S4023 } from './S4023'; // no-empty-interface
import { rule as S2187 } from './S2187'; // no-empty-test-file
import { rule as S888 } from './S888'; // no-equals-in-for-termination
import { rule as S6426 } from './S6426'; // no-exclusive-tests
import { rule as S6643 } from './S6643'; // no-extend-native
import { rule as S930 } from './S930'; // no-extra-arguments
import { rule as S1116 } from './S1116'; // no-extra-semi
import { rule as S6788 } from './S6788'; // no-find-dom-node
import { rule as S4139 } from './S4139'; // no-for-in-iterable
import { rule as S1530 } from './S1530'; // no-function-declaration-in-block
import { rule as S2990 } from './S2990'; // no-global-this
import { rule as S2137 } from './S2137'; // no-globals-shadowing
import { rule as S2589 } from './S2589'; // no-gratuitous-expressions
import { rule as S2068 } from './S2068'; // no-hardcoded-credentials
import { rule as S1313 } from './S1313'; // no-hardcoded-ip
import { rule as S6442 } from './S6442'; // no-hook-setter-in-body
import { rule as S1862 } from './S1862'; // no-identical-conditions
import { rule as S1764 } from './S1764'; // no-identical-expressions
import { rule as S4144 } from './S4144'; // no-identical-functions
import { rule as S2486 } from './S2486'; // no-ignored-exceptions
import { rule as S2201 } from './S2201'; // no-ignored-return
import { rule as S4328 } from './S4328'; // no-implicit-dependencies
import { rule as S2703 } from './S2703'; // no-implicit-global
import { rule as S4619 } from './S4619'; // no-in-misuse
import { rule as S1940 } from './S1940'; // no-inverted-boolean-check
import { rule as S2970 } from './S2970'; // no-incomplete-assertions
import { rule as S3801 } from './S3801'; // no-inconsistent-returns
import { rule as S3402 } from './S3402'; // no-incorrect-string-concat
import { rule as S2189 } from './S2189'; // no-infinite-loop
import { rule as S5604 } from './S5604'; // no-intrusive-permissions
import { rule as S4123 } from './S4123'; // no-invalid-await
import { rule as S3516 } from './S3516'; // no-invariant-returns
import { rule as S5759 } from './S5759'; // no-ip-forward
import { rule as S1119 } from './S1119'; // no-labels
import { rule as S6958 } from './S6958'; // no-literal-call
import { rule as S6660 } from './S6660'; // no-lonely-if
import { rule as S5734 } from './S5734'; // no-mime-sniff
import { rule as S4043 } from './S4043'; // no-misleading-array-reverse
import { rule as S6544 } from './S6544'; // no-misused-promises
import { rule as S5730 } from './S5730'; // no-mixed-content
import { rule as S1121 } from './S1121'; // no-nested-assignment
import { rule as S3358 } from './S3358'; // no-nested-conditional
import { rule as S2004 } from './S2004'; // no-nested-functions
import { rule as S1821 } from './S1821'; // no-nested-switch
import { rule as S4624 } from './S4624'; // no-nested-template-literals
import { rule as S881 } from './S881'; // no-nested-incdec
import { rule as S1751 } from './S1751'; // no-one-iteration-loop
import { rule as S4036 } from './S4036'; // no-os-command-from-path
import { rule as S1226 } from './S1226'; // no-parameter-reassignment
import { rule as S1533 } from './S1533'; // no-primitive-wrappers
import { rule as S2814 } from './S2814'; // no-redeclare
import { rule as S4165 } from './S4165'; // no-redundant-assignments
import { rule as S1125 } from './S1125'; // no-redundant-boolean
import { rule as S3626 } from './S3626'; // no-redundant-jump
import { rule as S4782 } from './S4782'; // no-redundant-optional
import { rule as S1110 } from './S1110'; // no-redundant-parentheses
import { rule as S6571 } from './S6571'; // no-redundant-type-constituents
import { rule as S3827 } from './S3827'; // no-reference-error
import { rule as S5736 } from './S5736'; // no-referrer-policy
import { rule as S3533 } from './S3533'; // no-require-or-define
import { rule as S4324 } from './S4324'; // no-return-type-any
import { rule as S5863 } from './S5863'; // no-same-argument-assert
import { rule as S3972 } from './S3972'; // no-same-line-conditional
import { rule as S6679 } from './S6679'; // no-self-compare
import { rule as S1301 } from './S1301'; // no-small-switch
import { rule as S105 } from './S105'; // no-tab
import { rule as S5257 } from './S5257'; // no-table-as-layout
import { rule as S4327 } from './S4327'; // no-this-alias
import { rule as S3696 } from './S3696'; // no-throw-literal
import { rule as S4822 } from './S4822'; // no-try-promise
import { rule as S4623 } from './S4623'; // no-undefined-argument
import { rule as S2138 } from './S2138'; // no-undefined-assignment
import { rule as S2681 } from './S2681'; // no-unenclosed-multiline-block
import { rule as S6486 } from './S6486'; // no-uniq-key
import { rule as S6747 } from './S6747'; // no-unknown-property
import { rule as S1763 } from './S1763'; // no-unreachable
import { rule as S6791 } from './S6791'; // no-unsafe
import { rule as S5042 } from './S5042'; // no-unsafe-unzip
import { rule as S6478 } from './S6478'; // no-unstable-nested-components
import { rule as S3984 } from './S3984'; // no-unthrown-error
import { rule as S4030 } from './S4030'; // no-unused-collection
import { rule as S905 } from './S905'; // no-unused-expressions
import { rule as S1172 } from './S1172'; // no-unused-function-argument
import { rule as S1068 } from './S1068'; // no-unused-private-class-members
import { rule as S3699 } from './S3699'; // no-use-of-empty-return-value
import { rule as S6676 } from './S6676'; // no-useless-call
import { rule as S2737 } from './S2737'; // no-useless-catch
import { rule as S6647 } from './S6647'; // no-useless-constructor
import { rule as S2123 } from './S2123'; // no-useless-increment
import { rule as S4335 } from './S4335'; // no-useless-intersection
import { rule as S6443 } from './S6443'; // no-useless-react-setstate
import { rule as S3504 } from './S3504'; // no-var
import { rule as S1526 } from './S1526'; // no-variable-usage-before-declaration
import { rule as S6299 } from './S6299'; // no-vue-bypass-sanitization
import { rule as S5547 } from './S5547'; // no-weak-cipher
import { rule as S4426 } from './S4426'; // no-weak-keys
import { rule as S2208 } from './S2208'; // no-wildcard-import
import { rule as S2757 } from './S2757'; // non-existent-operator
import { rule as S3760 } from './S3760'; // non-number-in-arithmetic-expression
import { rule as S2259 } from './S2259'; // null-dereference
import { rule as S5264 } from './S5264'; // object-alt-content
import { rule as S3498 } from './S3498'; // object-shorthand
import { rule as S3757 } from './S3757'; // operation-returning-nan
import { rule as S4721 } from './S4721'; // os-command
import { rule as S2819 } from './S2819'; // post-message
import { rule as S4524 } from './S4524'; // prefer-default-last
import { rule as S6572 } from './S6572'; // prefer-enum-initializers
import { rule as S4138 } from './S4138'; // prefer-for-of
import { rule as S6598 } from './S6598'; // prefer-function-type
import { rule as S1488 } from './S1488'; // prefer-immediate-return
import { rule as S4156 } from './S4156'; // prefer-namespace-keyword
import { rule as S6606 } from './S6606'; // prefer-nullish-coalescing
import { rule as S2428 } from './S2428'; // prefer-object-literal
import { rule as S6661 } from './S6661'; // prefer-object-spread
import { rule as S4634 } from './S4634'; // prefer-promise-shorthand
import { rule as S1126 } from './S1126'; // prefer-single-boolean-return
import { rule as S6666 } from './S6666'; // prefer-spread
import { rule as S6557 } from './S6557'; // prefer-string-starts-ends-with
import { rule as S3512 } from './S3512'; // prefer-template
import { rule as S4322 } from './S4322'; // prefer-type-guard
import { rule as S1264 } from './S1264'; // prefer-while
import { rule as S4823 } from './S4823'; // process-argv
import { rule as S4507 } from './S4507'; // production-debug
import { rule as S2245 } from './S2245'; // pseudo-random
import { rule as S1444 } from './S1444'; // public-static-readonly
import { rule as S5443 } from './S5443'; // publicly-writable-directories
import { rule as S6959 } from './S6959'; // reduce-initial-value
import { rule as S6564 } from './S6564'; // redundant-type-aliases
import { rule as S5843 } from './S5843'; // regex-complexity
import { rule as S4784 } from './S4784'; // regular-expr
import { rule as S6440 } from './S6440'; // rules-of-hooks
import { rule as S1438 } from './S1438'; // semi
import { rule as S5876 } from './S5876'; // session-regeneration
import { rule as S3499 } from './S3499'; // shorthand-property-grouping
import { rule as S6397 } from './S6397'; // single-char-in-character-classes
import { rule as S6035 } from './S6035'; // single-character-alternation
import { rule as S5852 } from './S5852'; // slow-regex
import { rule as S4818 } from './S4818'; // sockets
import { rule as S2392 } from './S2392'; // sonar-block-scoped-var
import { rule as S6439 } from './S6439'; // sonar-jsx-no-leaked-render
import { rule as S104 } from './S104'; // sonar-max-lines
import { rule as S138 } from './S138'; // sonar-max-lines-per-function
import { rule as S107 } from './S107'; // sonar-max-params
import { rule as S6324 } from './S6324'; // sonar-no-control-regex
import { rule as S1534 } from './S1534'; // sonar-no-dupe-keys
import { rule as S2639 } from './S2639'; // sonar-no-empty-character-class
import { rule as S128 } from './S128'; // sonar-no-fallthrough
import { rule as S5856 } from './S5856'; // sonar-no-invalid-regexp
import { rule as S109 } from './S109'; // sonar-no-magic-numbers
import { rule as S5868 } from './S5868'; // sonar-no-misleading-character-class
import { rule as S6326 } from './S6326'; // sonar-no-regex-spaces
import { rule as S6441 } from './S6441'; // sonar-no-unused-class-component-methods
import { rule as S1481 } from './S1481'; // sonar-no-unused-vars
import { rule as S6582 } from './S6582'; // sonar-prefer-optional-chain
import { rule as S6759 } from './S6759'; // sonar-prefer-read-only-props
import { rule as S6594 } from './S6594'; // sonar-prefer-regexp-exec
import { rule as S2077 } from './S2077'; // sql-queries
import { rule as S5973 } from './S5973'; // stable-tests
import { rule as S4829 } from './S4829'; // standard-input
import { rule as S6351 } from './S6351'; // stateful-regex
import { rule as S5739 } from './S5739'; // strict-transport-security
import { rule as S3003 } from './S3003'; // strings-comparison
import { rule as S3854 } from './S3854'; // super-invocation
import { rule as S131 } from './S131'; // switch-without-default
import { rule as S5256 } from './S5256'; // table-header
import { rule as S5260 } from './S5260'; // table-header-reference
import { rule as S5958 } from './S5958'; // test-check-exception
import { rule as S1135 } from './S1135'; // todo-tag
import { rule as S135 } from './S135'; // too-many-break-or-continue-in-loop
import { rule as S5867 } from './S5867'; // unicode-aware-regex
import { rule as S6535 } from './S6535'; // unnecessary-character-escapes
import { rule as S1128 } from './S1128'; // unused-import
import { rule as S5860 } from './S5860'; // unused-named-groups
import { rule as S4830 } from './S4830'; // unverified-certificate
import { rule as S5527 } from './S5527'; // unverified-hostname
import { rule as S3500 } from './S3500'; // updated-const-var
import { rule as S2310 } from './S2310'; // updated-loop-counter
import { rule as S2688 } from './S2688'; // use-isnan
import { rule as S4323 } from './S4323'; // use-type-alias
import { rule as S1154 } from './S1154'; // useless-string-operation
import { rule as S3758 } from './S3758'; // values-not-convertible-to-numbers
import { rule as S117 } from './S117'; // variable-name
import { rule as S3735 } from './S3735'; // void-use
import { rule as S4423 } from './S4423'; // weak-ssl
import { rule as S2817 } from './S2817'; // web-sql-database
import { rule as S5689 } from './S5689'; // x-powered-by
import { rule as S2755 } from './S2755'; // xml-parser-xxe
import { rule as S4817 } from './S4817';
import { t } from './typescript-eslint'; // xpath

/**
 * Maps ESLint rule keys declared in the JavaScript checks to rule implementations
 */
const rules: { [key: string]: Rule.RuleModule } = {
  S2376,
  S1077,
  S6827,
  S6844,
  S5850,
  S3782,
  S2234,
  S3513,
  S3796,
  S1528,
  S3524,
  S2699,
  S6333,
  S6329,
  S6275,
  S6332,
  S6302,
  S6304,
  S6317,
  S6270,
  S6308,
  S6303,
  S6321,
  S6265,
  S6249,
  S6281,
  S6245,
  S6252,
  S6319,
  S6327,
  S6330,
  S1529,
  S4798,
  S1105,
  S1472,
  S5742,
  S6092,
  S101,
  S3525,
  S1523,
  S3776,
  S3616,
  S124,
  S6353,
  S3973,
  S5757,
  S1848,
  S5693,
  S5728,
  S3330,
  S2255,
  S5122,
  S4502,
  S1541,
  S3798,
  S1788,
  S1874,
  S3514,
  S3403,
  S5247,
  S5725,
  S6080,
  S5743,
  S5869,
  S126,
  S5842,
  S4787,
  S5542,
  S3723,
  S6328,
  S1067,
  S1451,
  S3317,
  S2612,
  S2598,
  S1134,
  S1535,
  S2251,
  S5732,
  S1515,
  S100,
  S3800,
  S1527,
  S3531,
  S4790,
  S5691,
  S6754,
  S5254,
  S3785,
  S3686,
  S2692,
  S2092,
  S5659,
  S3415,
  S6477,
  S6481,
  S6749,
  S6853,
  S1439,
  S5148,
  S1479,
  S4622,
  S4084,
  S1994,
  S1082,
  S134,
  S2430,
  S2999,
  S4275,
  S3923,
  S2871,
  S6268,
  S2870,
  S6479,
  S3579,
  S6551,
  S2424,
  S1219,
  S5332,
  S6079,
  S1066,
  S3981,
  S125,
  S1854,
  S3001,
  S6957,
  S4621,
  S1192,
  S1871,
  S4143,
  S6019,
  S6323,
  S4158,
  S1186,
  S6331,
  S4023,
  S2187,
  S888,
  S6426,
  S6643,
  S930,
  S1116,
  S6788,
  S4139,
  S1530,
  S2990,
  S2137,
  S2589,
  S2068,
  S1313,
  S6442,
  S1862,
  S1764,
  S4144,
  S2486,
  S2201,
  S4328,
  S2703,
  S4619,
  S2970,
  S3801,
  S3402,
  S2189,
  S5604,
  S4123,
  S3516,
  S1940,
  S5759,
  S1119,
  S6958,
  S6660,
  S5734,
  S4043,
  S6544,
  S5730,
  S1121,
  S3358,
  S2004,
  S881,
  S1821,
  S4624,
  S1751,
  S4036,
  S1226,
  S1533,
  S2814,
  S4165,
  S1125,
  S3626,
  S4782,
  S1110,
  S6571,
  S3827,
  S5736,
  S3533,
  S4324,
  S5863,
  S3972,
  S6679,
  S1301,
  S105,
  S5257,
  S4327,
  S3696,
  S4822,
  S4623,
  S2138,
  S2681,
  S6486,
  S6747,
  S1763,
  S6791,
  S5042,
  S6478,
  S3984,
  S4030,
  S905,
  S1172,
  S1068,
  S3699,
  S6676,
  S2737,
  S6647,
  S2123,
  S4335,
  S6443,
  S3504,
  S1526,
  S6299,
  S5547,
  S4426,
  S2208,
  S2757,
  S3760,
  S2259,
  S5264,
  S3498,
  S3757,
  S4721,
  S2819,
  S4524,
  S6572,
  S4138,
  S6598,
  S1488,
  S4156,
  S6606,
  S2428,
  S6661,
  S4634,
  S1126,
  S6666,
  S6557,
  S3512,
  S4322,
  S1264,
  S4823,
  S4507,
  S2245,
  S1444,
  S5443,
  S6959,
  S6564,
  S5843,
  S4784,
  S6440,
  S1438,
  S5876,
  S3499,
  S6397,
  S6035,
  S5852,
  S4818,
  S2392,
  S6439,
  S104,
  S138,
  S107,
  S6324,
  S1534,
  S2639,
  S128,
  S5856,
  S109,
  S5868,
  S6326,
  S6441,
  S1481,
  S6582,
  S6759,
  S6594,
  S2077,
  S5973,
  S4829,
  S6351,
  S5739,
  S3003,
  S3854,
  S131,
  S5256,
  S5260,
  S5958,
  S1135,
  S135,
  S5867,
  S6535,
  S1128,
  S5860,
  S4830,
  S5527,
  S3500,
  S2310,
  S2688,
  S4323,
  S1154,
  S3758,
  S117,
  S3735,
  S4423,
  S2817,
  S5689,
  S2755,
  S4817,
  S108: e['no-empty'],
  S878: e['no-sequences'],
  S1090: a['iframe-has-title'],
  S1143: e['no-unsafe-finally'],
  S1199: e['no-lone-blocks'],
  S1314: e['no-octal'],
  S1321: e['no-with'],
  S1516: e['no-multi-str'],
  S1536: e['no-dupe-args'],
  S1656: e['no-self-assign'],
  S2094: t['no-extraneous-class'],
  S2432: e['no-setter-return'],
  S2685: e['no-caller'],
  S3523: e['no-new-func'],
  S3799: e['no-empty-pattern'],
  S3812: e['no-unsafe-negation'],
  S3834: e['no-new-native-nonconstructor'],
  S3863: i['no-duplicates'],
  S4125: e['valid-typeof'],
  S4140: e['no-sparse-arrays'],
  S6325: e['prefer-regex-literals'],
  S6435: r['require-render-return'],
  S6438: r['jsx-no-comment-textnodes'],
  S6509: e['no-extra-boolean-cast'],
  S6522: e['no-import-assign'],
  S6523: e['no-unsafe-optional-chaining'],
  S6534: e['no-loss-of-precision'],
  S6635: e['no-constructor-return'],
  S6638: e['no-constant-binary-expression'],
  S6644: e['no-unneeded-ternary'],
  S6645: e['no-undef-init'],
  S6650: e['no-useless-rename'],
  S6653: e['prefer-object-has-own'],
  S6654: e['no-proto'],
  S6657: e['no-octal-escape'],
  S6637: e['no-extra-bind'],
  S6671: e['prefer-promise-reject-errors'],
  S6746: r['no-direct-mutation-state'],
  S6748: r['no-children-prop'],
  S6750: r['no-render-return-value'],
  S6756: r['no-access-state-in-setstate'],
  S6757: r['no-this-in-sfc'],
  S6761: r['no-danger-with-children'],
  S6763: r['no-redundant-should-component-update'],
  S6766: r['no-unescaped-entities'],
  S6767: r['no-unused-prop-types'],
  S6770: r['jsx-pascal-case'],
  S6772: r['jsx-child-element-spacing'],
  S6774: r['prop-types'],
  S6775: r['default-props-match-prop-types'],
  S6789: r['no-is-mounted'],
  S6790: r['no-string-refs'],
  S6793: a['aria-proptypes'],
  S6807: a['role-has-required-aria-props'],
  S6811: a['role-supports-aria-props'],
  S6819: a['prefer-tag-over-role'],
  S6821: a['aria-role'],
  S6822: a['no-redundant-roles'],
  S6823: a['aria-activedescendant-has-tabindex'],
  S6824: a['aria-unsupported-elements'],
  S6825: a['no-aria-hidden-on-focusable'],
  S6836: e['no-case-declarations'],
  S6840: a['autocomplete-valid'],
  S6841: a['tabindex-no-positive'],
  S6842: a['no-noninteractive-element-to-interactive-role'],
  S6843: a['no-interactive-element-to-noninteractive-role'],
  S6845: a['no-noninteractive-tabindex'],
  S6846: a['no-access-key'],
  S6847: a['no-noninteractive-element-interactions'],
  S6848: a['no-static-element-interactions'],
  S6850: a['heading-has-content'],
  S6851: a['img-redundant-alt'],
  S6852: a['interactive-supports-focus'],
  S6859: i['no-absolute-path'],
  S6861: i['no-mutable-exports'],
};

const recommendedLegacyConfig: TSESLint.Linter.ConfigType = { plugins: ['sonarjs'], rules: {} };
const recommendedConfig: FlatConfig.Config = {
  name: 'sonarjs/recommended',
  plugins: {
    sonarjs: {
      rules,
    },
  },
  rules: {},
  settings: {
    react: {
      version: '999.999.999',
    },
  },
};

for (const [key, rule] of Object.entries(rules)) {
  console.log('KEY', key);

  const recommended = !!rule.meta!.docs?.recommended;

  recommendedConfig.rules![`sonarjs/${key}`] = recommended ? 'error' : 'off';
}

recommendedLegacyConfig.rules = recommendedConfig.rules;

export const configs = {
  recommended: recommendedConfig,
  'recommended-legacy': recommendedLegacyConfig,
};

/*
 package.json may be in current or parent dir depending on running with ts-jest or built js files
 we need to find it in both cases
 */
const packageJsonPath = findParent(__dirname, 'package.json');
const { name, version } = (
  packageJsonPath ? JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) : {}
) as PackageJson;
export const meta = {
  name,
  version,
};

export { rules };

export default { rules, configs, meta };

export * from './helpers';
