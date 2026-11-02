# DeepSeek Harness

English | [中文](README.zh.md)

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It uses an architecture where **everything is a plugin**, and is powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://github.com/cordiverse/paper).

This repository is a fork of [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness). The source instructions below clone the upstream repository.

## Developer preview

DeepSeek Harness is currently in _developer preview_ and is iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

## Run

### Prerequisites

- Node.js `^22.19.0` or `>=24.0.0`.
- pnpm if you run from source. The repository pins `pnpm@11.7.0` in `package.json`; if `pnpm --version` fails, run `corepack enable` once. It enables the pinned pnpm version.

### Run from `npm`

Run the published package:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI and prints its URL (`http://127.0.0.1:3080` by default). Open the printed URL in a browser. To use another port, append `--port 8080` (or another port number) to the command. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

The build step creates the package and Web UI files that `pnpm dsh web` uses. Run it after cloning and again whenever you change source code.

## Community and support

- Feel free to submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/Ycq5dCaS4">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

Run `pnpm run test` for the unit tests. `pnpm run test:coverage` runs the same tests and also checks code coverage, as CI does. `pnpm run test:e2e` runs tests that call real model APIs; these tests skip automatically when `DEEPSEEK_API_KEY` is not set. The complete command list is in [AGENTS.md](AGENTS.md#commands).

To work on the Web UI, first build the repository as described above. Then keep `pnpm dsh web` running in one terminal and run `pnpm run dev:web` in a second terminal. The second command rebuilds the Web UI plugins when their source changes, and the open page reloads the rebuilt plugins.

For agents, follow [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
