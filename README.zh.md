# DeepSeek Harness

[English](README.md) | 中文

DeepSeek Harness（`dsh`）是由 [DeepSeek AI](https://deepseek.com) 开发的开源 agent harness（智能体框架）。

它采用**一切皆插件**的架构，并由 [Cordis](https://github.com/cordiverse/cordis) 驱动，其设计参见论文 [_A Programming Paradigm for Spatiotemporal Composability_](https://github.com/cordiverse/paper)。

本仓库是 [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) 的 fork。下面的源码运行步骤克隆的是上游仓库。

## 开发者预览

DeepSeek Harness 目前处于 _开发者预览_ 阶段，正在快速迭代。**未来将出现破坏兼容性的变更。**

## 运行

### 前置条件

- Node.js `^22.19.0` 或 `>=24.0.0`。
- 从源码运行时还需要 pnpm。仓库在 `package.json` 中固定 `pnpm@11.7.0`；若 `pnpm --version` 无法运行，请运行一次 `corepack enable`。它会启用固定的 pnpm 版本。

### 通过 `npm` 运行

运行已发布的包：

```sh
npx @deepseek-ai/dsh web
```

该命令会启动 Web UI 并打印访问地址（默认为 `http://127.0.0.1:3080`）。在浏览器中打开打印出的地址即可。如需使用其他端口，请在命令末尾加上 `--port 8080`（或换成其他端口号）。详见 [Web UI 指南](docs/user/guide/index.md)。

### 从源码运行

如需从仓库源码运行：

```sh
git clone https://github.com/deepseek-ai/deepseek-harness.git
cd deepseek-harness
pnpm install
pnpm run build
pnpm dsh web
```

构建步骤会生成 `pnpm dsh web` 所需的包文件与 Web UI 文件。首次克隆后运行一次，之后每次修改源码后都要重新运行。

## 社区与支持

- 欢迎通过 [GitHub Discussions](https://github.com/deepseek-ai/deepseek-harness/discussions) 提交反馈或 bug 报告。
- 为你的插件仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) 话题，便于被发现。
- 欢迎加入 DeepSeek Harness 企微群：扫码添加企微小助手并填写入群问卷，完成后小助手会邀请你入群。

<table>
  <thead>
    <tr>
      <th align="center">企微小助手</th>
      <th align="center">入群问卷</th>
      <th align="center">微信公众号</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="center"><img src="assets/community-wecom-assistant.png" alt="DeepSeek Harness 企微小助手二维码" width="180" height="180"></td>
      <td align="center"><a href="https://trtgsjkv6r.feishu.cn/share/base/form/shrcnIt5twSVdLGD52KJBckGCgg"><img src="assets/community-wecom-survey.png" alt="DeepSeek Harness 入群问卷二维码" width="180" height="180"></a></td>
      <td align="center"><img src="assets/community-wechat-official-account.png" alt="DeepSeek Harness 团队微信公众号二维码" width="180" height="180"></td>
    </tr>
  </tbody>
</table>

## 参与贡献

参见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 开发

请先阅读[开发指南](docs/development.md)与[架构文档](docs/architecture.md)。

运行 `pnpm run test` 执行单元测试。`pnpm run test:coverage` 会运行同样的测试，并额外检查代码覆盖率（CI 也会执行这项检查）。`pnpm run test:e2e` 会调用真实的模型 API 进行测试；未设置 `DEEPSEEK_API_KEY` 时，这些测试会自动跳过。完整命令清单见 [AGENTS.md](AGENTS.md#commands)。

如需开发 Web UI，请先按上面的步骤构建仓库。然后在一个终端保持 `pnpm dsh web` 运行，并在另一个终端运行 `pnpm run dev:web`。后者会在 Web UI 插件源码发生变化时重新构建它们，已打开的页面会重新加载重建后的插件。

面向 agent：请遵循 [AGENTS.md](AGENTS.md)。

## 许可证

[MIT](LICENSE)

第三方依赖及其许可证见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
