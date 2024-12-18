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

export { rule as S5850 } from './S5850/index.js'; // anchor-precedence
export { rule as S3782 } from './S3782/index.js'; // argument-type
export { rule as S2234 } from './S2234/index.js'; // arguments-order
export { rule as S3513 } from './S3513/index.js'; // arguments-usage
export { rule as S3796 } from './S3796/index.js'; // array-callback-without-return
export { rule as S1528 } from './S1528/index.js'; // array-constructor
export { rule as S3524 } from './S3524/index.js'; // arrow-function-convention
export { rule as S2699 } from './S2699/index.js'; // assertions-in-tests
export { rule as S6333 } from './S6333/index.js'; // aws-apigateway-public-api
export { rule as S6329 } from './S6329/index.js'; // aws-ec2-rds-dms-public
export { rule as S6275 } from './S6275/index.js'; // aws-ec2-unencrypted-ebs-volume
export { rule as S6332 } from './S6332/index.js'; // aws-efs-unencrypted
export { rule as S6302 } from './S6302/index.js'; // aws-iam-all-privileges
export { rule as S6304 } from './S6304/index.js'; // aws-iam-all-resources-accessible
export { rule as S6317 } from './S6317/index.js'; // aws-iam-privilege-escalation
export { rule as S6270 } from './S6270/index.js'; // aws-iam-public-access
export { rule as S6308 } from './S6308/index.js'; // aws-opensearchservice-domain
export { rule as S6303 } from './S6303/index.js'; // aws-rds-unencrypted-databases
export { rule as S6321 } from './S6321/index.js'; // aws-restricted-ip-admin-access
export { rule as S6265 } from './S6265/index.js'; // aws-s3-bucket-granted-access
export { rule as S6249 } from './S6249/index.js'; // aws-s3-bucket-insecure-http
export { rule as S6281 } from './S6281/index.js'; // aws-s3-bucket-public-access
export { rule as S6245 } from './S6245/index.js'; // aws-s3-bucket-server-encryption
export { rule as S6252 } from './S6252/index.js'; // aws-s3-bucket-versioning
export { rule as S6319 } from './S6319/index.js'; // aws-sagemaker-unencrypted-notebook
export { rule as S6327 } from './S6327/index.js'; // aws-sns-unencrypted-topics
export { rule as S6330 } from './S6330/index.js'; // aws-sqs-unencrypted-queue
export { rule as S1529 } from './S1529/index.js'; // bitwise-operators
export { rule as S4798 } from './S4798/index.js'; // bool-param-default
export { rule as S1472 } from './S1472/index.js'; // call-argument-line
export { rule as S5742 } from './S5742/index.js'; // certificate-transparency
export { rule as S6092 } from './S6092/index.js'; // chai-determinate-assertion
export { rule as S101 } from './S101/index.js'; // class-name
export { rule as S3525 } from './S3525/index.js'; // class-prototype
export { rule as S1523 } from './S1523/index.js'; // code-eval
export { rule as S3776 } from './S3776/index.js'; // cognitive-complexity
export { rule as S3616 } from './S3616/index.js'; // comma-or-logical-or-case
export { rule as S124 } from './S124/index.js'; // comment-regex
export { rule as S6353 } from './S6353/index.js'; // concise-regex
export { rule as S3973 } from './S3973/index.js'; // conditional-indentation
export { rule as S5757 } from './S5757/index.js'; // confidential-information-logging
export { rule as S1848 } from './S1848/index.js'; // constructor-for-side-effects
export { rule as S5693 } from './S5693/index.js'; // content-length
export { rule as S5728 } from './S5728/index.js'; // content-security-policy
export { rule as S3330 } from './S3330/index.js'; // cookie-no-httponly
export { rule as S2255 } from './S2255/index.js'; // cookies
export { rule as S5122 } from './S5122/index.js'; // cors
export { rule as S4502 } from './S4502/index.js'; // csrf
export { rule as S1541 } from './S1541/index.js'; // cyclomatic-complexity
export { rule as S3798 } from './S3798/index.js'; // declarations-in-global-scope
export { rule as S1874 } from './S1874/index.js'; // deprecation
export { rule as S3514 } from './S3514/index.js'; // destructuring-assignment-syntax
export { rule as S3403 } from './S3403/index.js'; // different-types-comparison
export { rule as S5247 } from './S5247/index.js'; // disabled-auto-escaping
export { rule as S5725 } from './S5725/index.js'; // disabled-resource-integrity
export { rule as S6080 } from './S6080/index.js'; // disabled-timeout
export { rule as S5743 } from './S5743/index.js'; // dns-prefetching
export { rule as S5869 } from './S5869/index.js'; // duplicates-in-character-class
export { rule as S126 } from './S126/index.js'; // elseif-without-else
export { rule as S5842 } from './S5842/index.js'; // empty-string-repetition
export { rule as S4787 } from './S4787/index.js'; // encryption
export { rule as S5542 } from './S5542/index.js'; // encryption-secure-mode
export { rule as S3723 } from './S3723/index.js'; // enforce-trailing-comma
export { rule as S6328 } from './S6328/index.js'; // existing-groups
export { rule as S1067 } from './S1067/index.js'; // expression-complexity
export { rule as S1451 } from './S1451/index.js'; // file-header
export { rule as S3317 } from './S3317/index.js'; // file-name-differ-from-class
export { rule as S2612 } from './S2612/index.js'; // file-permissions
export { rule as S2598 } from './S2598/index.js'; // file-uploads
export { rule as S1134 } from './S1134/index.js'; // fixme-tag
export { rule as S1535 } from './S1535/index.js'; // for-in
export { rule as S2251 } from './S2251/index.js'; // for-loop-increment-sign
export { rule as S5732 } from './S5732/index.js'; // frame-ancestors
export { rule as S1515 } from './S1515/index.js'; // function-inside-loop
export { rule as S100 } from './S100/index.js'; // function-name
export { rule as S3800 } from './S3800/index.js'; // function-return-type
export { rule as S1527 } from './S1527/index.js'; // future-reserved-words
export { rule as S3531 } from './S3531/index.js'; // generator-without-yield
export { rule as S4790 } from './S4790/index.js'; // hashing
export { rule as S5691 } from './S5691/index.js'; // hidden-files
export { rule as S6754 } from './S6754/index.js'; // hook-use-state
export { rule as S3785 } from './S3785/index.js'; // in-operator-type-error
export { rule as S3686 } from './S3686/index.js'; // inconsistent-function-call
export { rule as S2692 } from './S2692/index.js'; // index-of-compare-to-positive-number
export { rule as S2092 } from './S2092/index.js'; // insecure-cookie
export { rule as S5659 } from './S5659/index.js'; // insecure-jwt-token
export { rule as S3415 } from './S3415/index.js'; // inverted-assertion-arguments
export { rule as S6477 } from './S6477/index.js'; // jsx-key
export { rule as S6481 } from './S6481/index.js'; // jsx-no-constructed-context-values
export { rule as S1439 } from './S1439/index.js'; // label-position
export { rule as S5148 } from './S5148/index.js'; // link-with-target-blank
export { rule as S1479 } from './S1479/index.js'; // max-switch-cases
export { rule as S4622 } from './S4622/index.js'; // max-union-size
export { rule as S1994 } from './S1994/index.js'; // misplaced-loop-counter
export { rule as S1082 } from './S1082/index.js'; // mouse-events-a11y
export { rule as S134 } from './S134/index.js'; // nested-control-flow
export { rule as S2999 } from './S2999/index.js'; // new-operator-misuse
export { rule as S3923 } from './S3923/index.js'; // no-all-duplicated-branches
export { rule as S2871 } from './S2871/index.js'; // no-alphabetical-sort
export { rule as S6268 } from './S6268/index.js'; // no-angular-bypass-sanitization
export { rule as S2870 } from './S2870/index.js'; // no-array-delete
export { rule as S6479 } from './S6479/index.js'; // no-array-index-key
export { rule as S3579 } from './S3579/index.js'; // no-associative-arrays
export { rule as S7059 } from './S7059/index.js'; // no-async-constructor
export { rule as S2424 } from './S2424/index.js'; // no-built-in-override
export { rule as S1219 } from './S1219/index.js'; // no-case-label-in-switch
export { rule as S5332 } from './S5332/index.js'; // no-clear-text-protocols
export { rule as S6079 } from './S6079/index.js'; // no-code-after-done
export { rule as S1066 } from './S1066/index.js'; // no-collapsible-if
export { rule as S3981 } from './S3981/index.js'; // no-collection-size-mischeck
export { rule as S125 } from './S125/index.js'; // no-commented-code
export { rule as S1854 } from './S1854/index.js'; // no-dead-store
export { rule as S3001 } from './S3001/index.js'; // no-delete-var
export { rule as S6957 } from './S6957/index.js'; // no-deprecated-react
export { rule as S4621 } from './S4621/index.js'; // no-duplicate-in-composite
export { rule as S1192 } from './S1192/index.js'; // no-duplicate-string
export { rule as S1871 } from './S1871/index.js'; // no-duplicated-branches
export { rule as S4143 } from './S4143/index.js'; // no-element-overwrite
export { rule as S6019 } from './S6019/index.js'; // no-empty-after-reluctant
export { rule as S6323 } from './S6323/index.js'; // no-empty-alternatives
export { rule as S4158 } from './S4158/index.js'; // no-empty-collection
export { rule as S6331 } from './S6331/index.js'; // no-empty-group
export { rule as S2187 } from './S2187/index.js'; // no-empty-test-file
export { rule as S888 } from './S888/index.js'; // no-equals-in-for-termination
export { rule as S6426 } from './S6426/index.js'; // no-exclusive-tests
export { rule as S930 } from './S930/index.js'; // no-extra-arguments
export { rule as S4139 } from './S4139/index.js'; // no-for-in-iterable
export { rule as S1530 } from './S1530/index.js'; // no-function-declaration-in-block
export { rule as S2990 } from './S2990/index.js'; // no-global-this
export { rule as S2137 } from './S2137/index.js'; // no-globals-shadowing
export { rule as S2589 } from './S2589/index.js'; // no-gratuitous-expressions
export { rule as S2068 } from './S2068/index.js'; // no-hardcoded-credentials
export { rule as S1313 } from './S1313/index.js'; // no-hardcoded-ip
export { rule as S6442 } from './S6442/index.js'; // no-hook-setter-in-body
export { rule as S1862 } from './S1862/index.js'; // no-identical-conditions
export { rule as S1764 } from './S1764/index.js'; // no-identical-expressions
export { rule as S4144 } from './S4144/index.js'; // no-identical-functions
export { rule as S2486 } from './S2486/index.js'; // no-ignored-exceptions
export { rule as S2201 } from './S2201/index.js'; // no-ignored-return
export { rule as S4328 } from './S4328/index.js'; // no-implicit-dependencies
export { rule as S2703 } from './S2703/index.js'; // no-implicit-global
export { rule as S4619 } from './S4619/index.js'; // no-in-misuse
export { rule as S1940 } from './S1940/index.js'; // no-inverted-boolean-check
export { rule as S2970 } from './S2970/index.js'; // no-incomplete-assertions
export { rule as S3801 } from './S3801/index.js'; // no-inconsistent-returns
export { rule as S3402 } from './S3402/index.js'; // no-incorrect-string-concat
export { rule as S6627 } from './S6627/index.js'; // no-internal-api-use
export { rule as S5604 } from './S5604/index.js'; // no-intrusive-permissions
export { rule as S4123 } from './S4123/index.js'; // no-invalid-await
export { rule as S3516 } from './S3516/index.js'; // no-invariant-returns
export { rule as S5759 } from './S5759/index.js'; // no-ip-forward
export { rule as S1119 } from './S1119/index.js'; // no-labels
export { rule as S6958 } from './S6958/index.js'; // no-literal-call
export { rule as S5734 } from './S5734/index.js'; // no-mime-sniff
export { rule as S4043 } from './S4043/index.js'; // no-misleading-array-reverse
export { rule as S5730 } from './S5730/index.js'; // no-mixed-content
export { rule as S1121 } from './S1121/index.js'; // no-nested-assignment
export { rule as S3358 } from './S3358/index.js'; // no-nested-conditional
export { rule as S2004 } from './S2004/index.js'; // no-nested-functions
export { rule as S1821 } from './S1821/index.js'; // no-nested-switch
export { rule as S4624 } from './S4624/index.js'; // no-nested-template-literals
export { rule as S881 } from './S881/index.js'; // no-nested-incdec
export { rule as S1751 } from './S1751/index.js'; // no-one-iteration-loop
export { rule as S4036 } from './S4036/index.js'; // no-os-command-from-path
export { rule as S1226 } from './S1226/index.js'; // no-parameter-reassignment
export { rule as S1533 } from './S1533/index.js'; // no-primitive-wrappers
export { rule as S4165 } from './S4165/index.js'; // no-redundant-assignments
export { rule as S1125 } from './S1125/index.js'; // no-redundant-boolean
export { rule as S3626 } from './S3626/index.js'; // no-redundant-jump
export { rule as S4782 } from './S4782/index.js'; // no-redundant-optional
export { rule as S1110 } from './S1110/index.js'; // no-redundant-parentheses
export { rule as S3827 } from './S3827/index.js'; // no-reference-error
export { rule as S5736 } from './S5736/index.js'; // no-referrer-policy
export { rule as S3533 } from './S3533/index.js'; // no-require-or-define
export { rule as S4324 } from './S4324/index.js'; // no-return-type-any
export { rule as S5863 } from './S5863/index.js'; // no-same-argument-assert
export { rule as S3972 } from './S3972/index.js'; // no-same-line-conditional
export { rule as S1607 } from './S1607/index.js'; // no-skipped-tests
export { rule as S1301 } from './S1301/index.js'; // no-small-switch
export { rule as S1291 } from './S1291/index.js'; // no-sonar-comments
export { rule as S105 } from './S105/index.js'; // no-tab
export { rule as S5257 } from './S5257/index.js'; // no-table-as-layout
export { rule as S4822 } from './S4822/index.js'; // no-try-promise
export { rule as S4623 } from './S4623/index.js'; // no-undefined-argument
export { rule as S2138 } from './S2138/index.js'; // no-undefined-assignment
export { rule as S2681 } from './S2681/index.js'; // no-unenclosed-multiline-block
export { rule as S6486 } from './S6486/index.js'; // no-uniq-key
export { rule as S6791 } from './S6791/index.js'; // no-unsafe
export { rule as S5042 } from './S5042/index.js'; // no-unsafe-unzip
export { rule as S6478 } from './S6478/index.js'; // no-unstable-nested-components
export { rule as S3984 } from './S3984/index.js'; // no-unthrown-error
export { rule as S4030 } from './S4030/index.js'; // no-unused-collection
export { rule as S1172 } from './S1172/index.js'; // no-unused-function-argument
export { rule as S3699 } from './S3699/index.js'; // no-use-of-empty-return-value
export { rule as S2737 } from './S2737/index.js'; // no-useless-catch
export { rule as S2123 } from './S2123/index.js'; // no-useless-increment
export { rule as S4335 } from './S4335/index.js'; // no-useless-intersection
export { rule as S6443 } from './S6443/index.js'; // no-useless-react-setstate
export { rule as S1526 } from './S1526/index.js'; // no-variable-usage-before-declaration
export { rule as S6299 } from './S6299/index.js'; // no-vue-bypass-sanitization
export { rule as S5547 } from './S5547/index.js'; // no-weak-cipher
export { rule as S4426 } from './S4426/index.js'; // no-weak-keys
export { rule as S2208 } from './S2208/index.js'; // no-wildcard-import
export { rule as S2757 } from './S2757/index.js'; // non-existent-operator
export { rule as S3760 } from './S3760/index.js'; // non-number-in-arithmetic-expression
export { rule as S2259 } from './S2259/index.js'; // null-dereference
export { rule as S5264 } from './S5264/index.js'; // object-alt-content
export { rule as S3757 } from './S3757/index.js'; // operation-returning-nan
export { rule as S4721 } from './S4721/index.js'; // os-command
export { rule as S2819 } from './S2819/index.js'; // post-message
export { rule as S4524 } from './S4524/index.js'; // prefer-default-last
export { rule as S1488 } from './S1488/index.js'; // prefer-immediate-return
export { rule as S2428 } from './S2428/index.js'; // prefer-object-literal
export { rule as S4634 } from './S4634/index.js'; // prefer-promise-shorthand
export { rule as S1126 } from './S1126/index.js'; // prefer-single-boolean-return
export { rule as S4322 } from './S4322/index.js'; // prefer-type-guard
export { rule as S1264 } from './S1264/index.js'; // prefer-while
export { rule as S4823 } from './S4823/index.js'; // process-argv
export { rule as S4507 } from './S4507/index.js'; // production-debug
export { rule as S2245 } from './S2245/index.js'; // pseudo-random
export { rule as S1444 } from './S1444/index.js'; // public-static-readonly
export { rule as S5443 } from './S5443/index.js'; // publicly-writable-directories
export { rule as S6959 } from './S6959/index.js'; // reduce-initial-value
export { rule as S6564 } from './S6564/index.js'; // redundant-type-aliases
export { rule as S5843 } from './S5843/index.js'; // regex-complexity
export { rule as S4784 } from './S4784/index.js'; // regular-expr
export { rule as S5876 } from './S5876/index.js'; // session-regeneration
export { rule as S3499 } from './S3499/index.js'; // shorthand-property-grouping
export { rule as S6397 } from './S6397/index.js'; // single-char-in-character-classes
export { rule as S6035 } from './S6035/index.js'; // single-character-alternation
export { rule as S5852 } from './S5852/index.js'; // slow-regex
export { rule as S4818 } from './S4818/index.js'; // sockets
export { rule as S2392 } from './S2392/index.js'; // sonar-block-scoped-var
export { rule as S6439 } from './S6439/index.js'; // sonar-jsx-no-leaked-render
export { rule as S104 } from './S104/index.js'; // sonar-max-lines
export { rule as S138 } from './S138/index.js'; // sonar-max-lines-per-function
export { rule as S6324 } from './S6324/index.js'; // sonar-no-control-regex
export { rule as S2639 } from './S2639/index.js'; // sonar-no-empty-character-class
export { rule as S128 } from './S128/index.js'; // sonar-no-fallthrough
export { rule as S5856 } from './S5856/index.js'; // sonar-no-invalid-regexp
export { rule as S109 } from './S109/index.js'; // sonar-no-magic-numbers
export { rule as S5868 } from './S5868/index.js'; // sonar-no-misleading-character-class
export { rule as S6326 } from './S6326/index.js'; // sonar-no-regex-spaces
export { rule as S6441 } from './S6441/index.js'; // sonar-no-unused-class-component-methods
export { rule as S1481 } from './S1481/index.js'; // sonar-no-unused-vars
export { rule as S6582 } from './S6582/index.js'; // sonar-prefer-optional-chain
export { rule as S6759 } from './S6759/index.js'; // sonar-prefer-read-only-props
export { rule as S6594 } from './S6594/index.js'; // sonar-prefer-regexp-exec
export { rule as S2077 } from './S2077/index.js'; // sql-queries
export { rule as S5973 } from './S5973/index.js'; // stable-tests
export { rule as S4829 } from './S4829/index.js'; // standard-input
export { rule as S6351 } from './S6351/index.js'; // stateful-regex
export { rule as S5739 } from './S5739/index.js'; // strict-transport-security
export { rule as S3003 } from './S3003/index.js'; // strings-comparison
export { rule as S3854 } from './S3854/index.js'; // super-invocation
export { rule as S5256 } from './S5256/index.js'; // table-header
export { rule as S5260 } from './S5260/index.js'; // table-header-reference
export { rule as S5958 } from './S5958/index.js'; // test-check-exception
export { rule as S1135 } from './S1135/index.js'; // todo-tag
export { rule as S135 } from './S135/index.js'; // too-many-break-or-continue-in-loop
export { rule as S5867 } from './S5867/index.js'; // unicode-aware-regex
export { rule as S1128 } from './S1128/index.js'; // unused-import
export { rule as S5860 } from './S5860/index.js'; // unused-named-groups
export { rule as S4830 } from './S4830/index.js'; // unverified-certificate
export { rule as S5527 } from './S5527/index.js'; // unverified-hostname
export { rule as S3500 } from './S3500/index.js'; // updated-const-var
export { rule as S2310 } from './S2310/index.js'; // updated-loop-counter
export { rule as S4323 } from './S4323/index.js'; // use-type-alias
export { rule as S1154 } from './S1154/index.js'; // useless-string-operation
export { rule as S3758 } from './S3758/index.js'; // values-not-convertible-to-numbers
export { rule as S117 } from './S117/index.js'; // variable-name
export { rule as S3735 } from './S3735/index.js'; // void-use
export { rule as S4423 } from './S4423/index.js'; // weak-ssl
export { rule as S2817 } from './S2817/index.js'; // web-sql-database
export { rule as S5689 } from './S5689/index.js'; // x-powered-by
export { rule as S2755 } from './S2755/index.js'; // xml-parser-xxe
export { rule as S4817 } from './S4817/index.js'; // xpath
export { rule as S2301 } from './S2301/index.js';
