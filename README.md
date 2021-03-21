PipefyEnhancer
=================

A suit to improve various tasks in context of Pipefy. 

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/pipefy-enhancer.svg)](https://npmjs.org/package/pipefy-enhancer)
[![Downloads/week](https://img.shields.io/npm/dw/pipefy-enhancer.svg)](https://npmjs.org/package/pipefy-enhancer)
[![License](https://img.shields.io/npm/l/pipefy-enhancer.svg)](https://github.com/GenieTim/pipefy-enhancer/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g pipefy-enhancer
$ PipefyEnhancer COMMAND
running command...
$ PipefyEnhancer (-v|--version|version)
pipefy-enhancer/1.0.3 darwin-x64 node-v15.11.0
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
* [`PipefyEnhancer remove-duplicate-db-entries TOKEN DATABASEID`](#pipefyenhancer-remove-duplicate-db-entries-token-databaseid)

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
  The editor for the E-Mail-Templates is read from $VISUAL or $EDITOR environment variables. 
  If neither of those are present, notepad (on Windows) or vim (Linux or Mac) is used.
  (See: https://github.com/SBoudrias/Inquirer.js/#editor---type-editor)
```

_See code: [src/commands/edit-email-templates.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.0.3/src/commands/edit-email-templates.js)_

## `PipefyEnhancer generate-docs TOKEN ORGANIZATIONID [PIPEIDS]`

Generate a documentation of your pipes

```
USAGE
  $ PipefyEnhancer generate-docs TOKEN ORGANIZATIONID [PIPEIDS]

ARGUMENTS
  TOKEN           The API-Token for the Pipefy GraphQL API
  ORGANIZATIONID  The id of the organization whose Pipes to document.
  PIPEIDS         The comma-separated ids of the pipes to document. Empty = all pipes of your organization.

OPTIONS
  -f, --format=html|pdf    [default: html] Format to use for output
  -l, --locale=en          [default: en] Language to use for documentation
  -p, --filename=filename  [default: pipe_documentation] File path & name prefix to use for output

DESCRIPTION
  ...
  This command loops all your Pipefy E-Mail-Templates, Automations etc. and 
  outputs them into a HTML file (per pipe) which you can then export as PDF or 
  whatever suits your needs.
```

_See code: [src/commands/generate-docs.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.0.3/src/commands/generate-docs.js)_

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

_See code: [src/commands/hello.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.0.3/src/commands/hello.js)_

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

## `PipefyEnhancer remove-duplicate-db-entries TOKEN DATABASEID`

Remove duplicates from a Pipefy Database

```
USAGE
  $ PipefyEnhancer remove-duplicate-db-entries TOKEN DATABASEID

ARGUMENTS
  TOKEN       The API-Token for the Pipefy GraphQL API
  DATABASEID  The id of the database to filter for duplicates.

OPTIONS
  -m, --merge  Merge if duplicates have connected cards.
               CAUTION: make sure the connection field is editable.

  --dry        Whether to do a dry run: just output how many entries would be deleted etc.

DESCRIPTION
  ...
  This command loops all your Pipefy DataBase Entries of the specified database 
  and deletes the ones duplicates without connected cards (or merges them, see "-m")
```

_See code: [src/commands/remove-duplicate-db-entries.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.0.3/src/commands/remove-duplicate-db-entries.js)_
<!-- commandsstop -->
