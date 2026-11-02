# DeepSeek Harness

English | [中文](README.zh.md)

DeepSeek Harness (`dsh`) is an open-source agent harness developed by [DeepSeek AI](https://deepseek.com).

It uses an architecture where **everything is a plugin**, and is powered by [Cordis](https://github.com/cordiverse/cordis), whose design is described in [_A Programming Paradigm for Spatiotemporal Composability_](https://github.com/cordiverse/paper).

This repository is a fork of [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness).

## Developer preview

DeepSeek Harness is currently in _developer preview_ and is iterating rapidly. **THERE WILL BE COMPATIBILITY-BREAKING CHANGES.**

## Run

Both installation paths need Node.js `^22.19.0` or `>=24.0.0`; the source checkout also needs Corepack-enabled pnpm. Run `corepack enable` if `pnpm --version` does not resolve; the repository pins `pnpm@11.7.0` in `package.json`.

### Run from `npm`

Run the published package:

```sh
npx @deepseek-ai/dsh web
```

The command starts the Web UI at `http://127.0.0.1:3080` by default; pass `--port <port>` to serve on another port. See [Web UI guide](docs/user/guide/index.md).

### Run from source

To run from a repository checkout:

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

`pnpm dsh web` loads the package and Web frontend artifacts produced by `pnpm run build`; build once after cloning and rerun it after changing source.

## Community and support

- Feel free to submit feedback or bug reports through [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions).
- Add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic to your plugin repository for discoverability.
- Join <a href="https://discord.gg/Ycq5dCaS4">DeepSeek Harness Discord community</a>.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Development

Start with the [development guide](docs/development.md) and [architecture documentation](docs/architecture.md).

Run `pnpm run test` for the unit suite, `pnpm run test:coverage` for the CI coverage gate, and `pnpm run test:e2e` for real-API tests, which self-skip without `DEEPSEEK_API_KEY`. The complete command list is in [AGENTS.md](AGENTS.md#commands).

For Web UI development, build the repository, then run `pnpm dsh web` in one terminal and `pnpm run dev:web` in another; the watcher rebuilds client plugin bundles, and the running Web UI reloads them.

For agents, follow [AGENTS.md](AGENTS.md).

## License

[MIT](LICENSE)

Third-party dependencies and their licenses are disclosed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
