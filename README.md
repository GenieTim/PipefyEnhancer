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
pipefy-enhancer/1.4.1 darwin-x64 node-v16.6.1
$ PipefyEnhancer --help [COMMAND]
USAGE
  $ PipefyEnhancer COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`PipefyEnhancer help [COMMAND]`](#pipefyenhancer-help-command)

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

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.2.2/src/commands/help.ts)_
<!-- commandsstop -->

# Contributing

We are very happy to review any pull request.

# Legal

Pipefy is not affiliated in any way with this program and does neither support nor endorse it at the current point in time.
