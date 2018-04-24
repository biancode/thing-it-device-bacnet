# Installing

```
npm install
```

# Usage


## Start

```
npm start -- <options...>
```

## Options

- `--port <port>` (by default `47808`): port of the server.
- `--filePath <file_path>`: path to the `EDE` file.
- `--reqDelay <delay>` (by default `20 ms`): timeout between end of old request and start of new request.
- `--reqThread <thread>` (by default `1`): number of concurrent unicast requests to the one `IP:PORT`.

# Units

Application implements two types of units:
- `native` units - implements simulation logic to change properties of the `BACnet Object`s by the algorithms of the `BACnet` protocol.
- `custom` units - implements simulation logic of `custom` devices. Eg: `noop`, `function`, `termostat`, `jalousie` etc.

## Custom units

### Noop

Implements the `No operation` logic. It sets as default value for `cust.-unit-type` column in EDE files.

Aliases: `''`, `default`, `0`, `noop`.

Functions:
- `default` (aliasses: `''`, `default`): implements the `No operation` logic.

### Function

Implements the `distribution (mathematics)` logic.

Aliases: `1`, `fn`, `func`, `function`.

Functions:
- `uniform` (aliases: `''`, `default`, `0`, `unif`, `uniform`, `uniformDistribution`): implements the logic of changes of `Present Value` property by `uniform` distribution.
- `normal` (aliases: `1`, `gaus`, `gaussian`, `norm`, `normal`, `normalDistribution`): implements the logic of changes of `Present Value` property by `normal` distribution.

# EDE file

Application processed next optional EDE columns:

`cust.-unit-type` | `cust.-unit-id` | `cust.-unit-fn` | `cust.-min.-value` | `cust.-max.-value` | `cust.-freq`
- `cust.-unit-type` (default: `noop`): type of the `custom` unit.
- `cust.-unit-id` (default: `auto`): ID of the `custom` unit.
- `cust.-unit-fn` (default: `''`): function of the `native` unit in the `custom` unit.
- `cust.-min.-value` (default: get from `cust.-unit-fn`): min value for simulation algorithm.
- `cust.-max.-value` (default: get from `cust.-unit-fn`): max value for simulation algorithm.
- `cust.-freq` (default: get from `cust.-unit-fn`): frequency of changes of values.

