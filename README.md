# PipefyEnhancer

A suit to improve various tasks in context of Pipefy.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/pipefy-enhancer.svg)](https://npmjs.org/package/pipefy-enhancer)
[![Downloads/week](https://img.shields.io/npm/dw/pipefy-enhancer.svg)](https://npmjs.org/package/pipefy-enhancer)
[![License](https://img.shields.io/npm/l/pipefy-enhancer.svg)](https://github.com/GenieTim/pipefy-enhancer/blob/master/package.json)

<!-- toc -->
* [PipefyEnhancer](#pipefyenhancer)
* [About & Installation](#about--installation)
* [Usage](#usage)
* [Commands](#commands)
* [Contributing](#contributing)
* [Legal](#legal)
<!-- tocstop -->

# About & Installation

This is a command-line application.
To install it, you need to have [NodeJS](https://nodejs.org/en/) installed.
Afterwards, see the Section [Usage](#usage).

As this app interacts with Pipefy, it also requires an OAuth2 Bearer API token so it can access the data.
To obtain your own token, please follow the following instructions:

- Go to https://app.pipefy.com/tokens
- Click on 'Generate new token'
- Give the token a description
- Click 'Save'

Copy this token and use it as an argument for the commands as listed below.

Other descriptions on how to obtain your token can be found in the [official documentation](https://developers.pipefy.com/reference) and in the [Pipefy Community](https://community.pipefy.com/api-76/introduction-what-is-graphql-889).

# Usage

<!-- usage -->
```sh-session
$ npm install -g pipefy-enhancer
$ PipefyEnhancer COMMAND
running command...
$ PipefyEnhancer (-v|--version|version)
pipefy-enhancer/1.4.2 darwin-x64 node-v16.8.0
$ PipefyEnhancer --help [COMMAND]
USAGE
  $ PipefyEnhancer COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`PipefyEnhancer add-default-values TOKEN`](#pipefyenhancer-add-default-values-token)
* [`PipefyEnhancer add-field-to-every-phase TOKEN PIPEID`](#pipefyenhancer-add-field-to-every-phase-token-pipeid)
* [`PipefyEnhancer add-field-to-every-pipe TOKEN ORGANIZATIONID PHASENAME`](#pipefyenhancer-add-field-to-every-pipe-token-organizationid-phasename)
* [`PipefyEnhancer edit-email-templates TOKEN ORGANIZATIONID [PIPEIDS]`](#pipefyenhancer-edit-email-templates-token-organizationid-pipeids)
* [`PipefyEnhancer fix-duplicate-field-values TOKEN DATABASEID`](#pipefyenhancer-fix-duplicate-field-values-token-databaseid)
* [`PipefyEnhancer generate-docs TOKEN ORGANIZATIONID [PIPEIDS]`](#pipefyenhancer-generate-docs-token-organizationid-pipeids)
* [`PipefyEnhancer hello`](#pipefyenhancer-hello)
* [`PipefyEnhancer help [COMMAND]`](#pipefyenhancer-help-command)
* [`PipefyEnhancer remove-duplicate-db-entries TOKEN DATABASEID`](#pipefyenhancer-remove-duplicate-db-entries-token-databaseid)

## `PipefyEnhancer add-default-values TOKEN`

Set a value to a field in all cards of a phase

```
USAGE
  $ PipefyEnhancer add-default-values TOKEN

ARGUMENTS
  TOKEN  The API-Token for the Pipefy GraphQL API

OPTIONS
  --dry              Whether to do a dry run: just output how many entries would be deleted etc.
  --fieldId=fieldId  (required) The field id to change its values
  --phaseId=phaseId  (required) The phase to change the cards in
  --value=value      (required) The value to change the field to

DESCRIPTION
  ...
  This command loops all your Cards of the specified pipe and phase 
  and sets the specified value on the specified field
```

_See code: [src/commands/add-default-values.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.4.2/src/commands/add-default-values.js)_

## `PipefyEnhancer add-field-to-every-phase TOKEN PIPEID`

Add a field to every phase in a pipe

```
USAGE
  $ PipefyEnhancer add-field-to-every-phase TOKEN PIPEID

ARGUMENTS
  TOKEN   The API-Token for the Pipefy GraphQL API
  PIPEID  The id of the pipe to add the fields to.

OPTIONS
  -d, --description=description
      The description of the field.

  -l, --label=label
      (required) The label of the field.

  -t, 
  --type=assignee_select|attachment|checklist_horizontal|checklist_vertical|cnpj|connector|cpf|currency|date|datetime|du
  e_date|email|id|label_select|long_text|number|phone|radio_horizontal|radio_vertical|select|short_text|statement|time
      (required) The type of the field.

  --help=help

  --minimal
      Whether to use the minimal view

DESCRIPTION
  ...
  This command loops all your Pipefy phases of the pipe specified and adds the field as specified.
```

_See code: [src/commands/add-field-to-every-phase.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.4.2/src/commands/add-field-to-every-phase.js)_

## `PipefyEnhancer add-field-to-every-pipe TOKEN ORGANIZATIONID PHASENAME`

Add a field to every phase with the same name in all pipes

```
USAGE
  $ PipefyEnhancer add-field-to-every-pipe TOKEN ORGANIZATIONID PHASENAME

ARGUMENTS
  TOKEN           The API-Token for the Pipefy GraphQL API
  ORGANIZATIONID  The id of the organization to load the pipes for.
  PHASENAME       The name of the phase in all pipes to add the fields to.

OPTIONS
  -d, --description=description
      The description of the field.

  -l, --label=label
      (required) The label of the field.

  -t, 
  --type=assignee_select|attachment|checklist_horizontal|checklist_vertical|cnpj|connector|cpf|currency|date|datetime|du
  e_date|email|id|label_select|long_text|number|phone|radio_horizontal|radio_vertical|select|short_text|statement|time
      (required) The type of the field.

  --editable
      Whether the field can be edited in other phases

  --help=help

  --minimal
      Whether to use the minimal view

DESCRIPTION
  ...
  This command loops all your Pipefy pipes adds the field as specified to every phase with the specified name.
```

_See code: [src/commands/add-field-to-every-pipe.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.4.2/src/commands/add-field-to-every-pipe.js)_

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

_See code: [src/commands/edit-email-templates.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.4.2/src/commands/edit-email-templates.js)_

## `PipefyEnhancer fix-duplicate-field-values TOKEN DATABASEID`

Remove duplicate field values from a Pipefy Database

```
USAGE
  $ PipefyEnhancer fix-duplicate-field-values TOKEN DATABASEID

ARGUMENTS
  TOKEN       The API-Token for the Pipefy GraphQL API
  DATABASEID  The id of the database to filter for duplicates.

OPTIONS
  --checkRearrange         Whether the field's value should be checked for a match when split at a space
                           E.g.: names: 'Test Nest' matches 'Nest Test'.

  --dry                    Whether to do a dry run: just output how many entries would be deleted etc.

  --fieldCheck=fieldCheck  (required) The first field to check the value

  --fieldReset=fieldReset  (required) The field to set to an empty value if it has the same value as fieldCheck

DESCRIPTION
  ...
  This command loops all your Pipefy DataBase Entries of the specified database 
  and sets one field to empty if it has the same value as another one
```

_See code: [src/commands/fix-duplicate-field-values.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.4.2/src/commands/fix-duplicate-field-values.js)_

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

_See code: [src/commands/generate-docs.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.4.2/src/commands/generate-docs.js)_

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

_See code: [src/commands/hello.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.4.2/src/commands/hello.js)_

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.3/src/commands/help.ts)_

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

_See code: [src/commands/remove-duplicate-db-entries.js](https://github.com/GenieTim/PipefyEnhancer/blob/v1.4.2/src/commands/remove-duplicate-db-entries.js)_
<!-- commandsstop -->

# Contributing

We are very happy to review any pull request.

# Legal

Pipefy is not affiliated in any way with this program and does neither support nor endorse it at the current point in time.
