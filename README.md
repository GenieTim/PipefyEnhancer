PipefyEnhancer
=================

A suit to improve various tasks in context of Pipefy. 

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/PipefyEmailEditor.svg)](https://npmjs.org/package/PipefyEmailEditor)
[![Downloads/week](https://img.shields.io/npm/dw/PipefyEmailEditor.svg)](https://npmjs.org/package/PipefyEmailEditor)
[![License](https://img.shields.io/npm/l/PipefyEmailEditor.svg)](https://github.com/GenieTim/PipefyEmailEditor/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g PipefyEnhancer
$ PipefyEnhancer COMMAND
running command...
$ PipefyEnhancer (-v|--version|version)
PipefyEnhancer/0.0.0 darwin-x64 node-v15.7.0
$ PipefyEnhancer --help [COMMAND]
USAGE
  $ PipefyEnhancer COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`PipefyEnhancer edit-email-templates TOKEN ORGANIZATIONID [PIPEIDS]`](#pipefyenhancer-edit-email-templates-token-organizationid-pipeids)
* [`PipefyEnhancer generate-docs TOKEN ORGANIZATIONID [PIPEIDS]`](#pipefyenhancer-generate-docs-token-organizationid-pipeids)
* [`PipefyEnhancer hello`](#pipefyenhancer-hello)
* [`PipefyEnhancer help [COMMAND]`](#pipefyenhancer-help-command)

## `PipefyEnhancer edit-email-templates TOKEN ORGANIZATIONID [PIPEIDS]`

Edit your Pipefy E-Mail Templates

```
USAGE
  $ PipefyEnhancer edit-email-templates TOKEN ORGANIZATIONID [PIPEIDS]

ARGUMENTS
  TOKEN           The API-Token for the Pipefy GraphQL API
  ORGANIZATIONID  The id of the organization whose E-Mails to edit. Not used if pipeIds is specified.
  PIPEIDS         The comma-separated ids of the pipes whose E-Mails to edit. Empty = all pipes of your organization.

OPTIONS
  -a, --otherFields=subject|name|fromName|fromEmail|toEmail|ccEmail|bccEmail  whether to ask/replace other fields
                                                                              (instead of only the E-Mail body)
                                                                              specified here

  -l, --language=language                                                     language to reset for all templates

  -s, --skipEdit                                                              skip edit of E-Mail body

  -t, --timezone=timezone                                                     timezone to reset for all templates

DESCRIPTION
  ...
  This command loops all your Pipefy E-Mail-Templates so you can fix them one by one.
```

_See code: [src/commands/edit-email-templates.js](https://github.com/GenieTim/PipefyEnhancer/blob/v0.0.0/src/commands/edit-email-templates.js)_

## `PipefyEnhancer generate-docs TOKEN ORGANIZATIONID [PIPEIDS]`

Generate a documentation of your pipes

```
USAGE
  $ PipefyEnhancer generate-docs TOKEN ORGANIZATIONID [PIPEIDS]

ARGUMENTS
  TOKEN           The API-Token for the Pipefy GraphQL API
  ORGANIZATIONID  The id of the organization whose Pipes to document.
  PIPEIDS         The comma-separated ids of the pipes to document. Empty = all pipes of your organization.

DESCRIPTION
  ...
  This command loops all your Pipefy E-Mail-Templates, Automations etc. and 
  outputs them into a HTML file (per pipe) which you can then export as PDF or 
  whatever suits your needs.
```

_See code: [src/commands/generate-docs.js](https://github.com/GenieTim/PipefyEnhancer/blob/v0.0.0/src/commands/generate-docs.js)_

## `PipefyEnhancer hello`

This is a test command

```
USAGE
  $ PipefyEnhancer hello

OPTIONS
  -n, --name=name  name to print

DESCRIPTION
  ...
  You can call it so that it greets you.
```

_See code: [src/commands/hello.js](https://github.com/GenieTim/PipefyEnhancer/blob/v0.0.0/src/commands/hello.js)_

## `PipefyEnhancer help [COMMAND]`

display help for PipefyEnhancer

```
USAGE
  $ PipefyEnhancer help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.1/src/commands/help.ts)_
<!-- commandsstop -->
