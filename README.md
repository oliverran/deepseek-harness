# guang harness · GH

<img src="assets/dsh-app-icon.png" alt="guang harness 鲸鱼娘应用图标" width="96" />

基于 [deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype) 定制的 **guang harness**（简称 **GH**），与 [guangcode](https://github.com/oliverran/guang-code) 同属 GUANG 系列：通过 GitHub 下任务，在本地后台执行，用 Web 工作台跟进，并提供 macOS 桌面鲸鱼娘与应用入口。

> 这是社区定制的研究原型，不是 DeepSeek 官方产品，也不等同于官方文章中的完整设计。使用前请审阅权限、执行命令与接单规则；部分文章中描述的能力尚未实现。

本版本保存在 [oliverran/deepseek-harness 的 `codex/dsh-superagent` 分支](https://github.com/oliverran/deepseek-harness/tree/codex/dsh-superagent)，是独立 Superagent 项目。该仓库的 `master` 分支存放 Harness 主项目。

## 主要功能

- **GitHub 任务闭环**：接收请求、判断是否接单，为任务创建独立 Session 和执行目录，在原讨论中回复进展或交付 PR；可选接入飞书。
- **同账号下任务**：支持操作者和代理共用 GitHub 账号，通过明确的 `/task` 指令与自动回复标记，避免代理回复循环触发。
- **任务并行与持续跟进**：按配置的容量并行执行；在原 Issue 或 PR 中追加请求，可继续关联任务。是否接受仍由权限与接单规则决定。
- **工作台重组**：以待处理事项、任务进展和结果为中心，保留搜索、重新评估、重试、停止与设置历史。
- **macOS 桌面伴侣**：全局悬浮、跨桌面显示的紧凑鲸鱼娘，支持悬停、拖动、落地动效，以及喂食、休息、隐藏和尺寸调整。
- **guang harness.app 入口**：启动或复用本地后台服务，打开控制台并显示桌面伴侣；提供独立应用图标。

## 四个栏目怎么用

| 栏目 | 用途 |
| --- | --- |
| **工作台** | 查看当前仓库、需要你处理的事项、系统问题、近 24 小时活动和任务运行情况 |
| **任务** | 按状态查看任务；详情优先展示最新进展、结果和已记录的关联 PR，授权等技术信息折叠显示 |
| **消息与记录** | 在「讨论与消息」「接单原因」「连接与过滤」之间切换，排查请求有没有收到、为什么接受或忽略 |
| **设置** | 「账号与仓库」「接单规则」「执行与交付」「高级设置」；完整提示词位于高级设置中 |

任务处于「等待新触发」表示等待后续消息，不代表已完成；关联 PR 也不代表已合并。状态以任务记录和实际交付为准。

## 三款主题

在 **设置 → 外观** 中切换主题，点击立即生效，自动保存于当前浏览器的本机存储，刷新或重新打开后仍保留；同源浏览器标签页会同步主题。

| 主题 | 风格 |
| --- | --- |
| **极简浅色** | 黑白灰与细分隔线，突出任务和结果 |
| **温暖纸色** | 暖纸底色、石色侧栏与陶土色点缀 |
| **深色专注** | 石墨灰、柔和的文字和鼠尾草绿点缀 |

三款主题使用相同的侧栏布局；小窗口自动收起导航文字，保留图标和可访问名称。切换主题不改动模型、接单规则或后台运行状态。品牌名称更新后，底层 `dsh-superagent` 插件标识、已有 profile、数据目录与应用 bundle identifier 保留，已有会话和宠物偏好无需迁移。

## 用 oliverran 给自己下任务

首次配置时，将 `oliverran` 加入允许名单，并在 GitHub 来源中启用「接收仓库里的新 Issue」与「接收仓库里的评论」。当前本地实例使用的目标仓库为 `oliverran/deepseek-harness`，这些账号与仓库设置不随源码自动迁移。

1. 在工作台右上角点击 **发起任务**，按照引导前往 GitHub 创建 Issue。
2. 填写标题，在 **正文开头**保留以下指令，并说明需求与验收标准：

   ```text
   @oliverran /task 请检查 README 的安装说明，修正文档并提交 PR，暂时不要合并。

   验收标准：
   - 安装命令与 package.json 一致
   - 说明验证方式
   ```

3. 发布 Issue，等待来源同步与接单，在「任务」页查看进展；未出现时，到「消息与记录」检查连接与接单原因。
4. 继续同一任务时，在 **原 Issue 或 PR 下发布新评论**，仍以 `@oliverran /task` 开头，例如：

   ```text
   @oliverran /task 再补充 macOS 的启动步骤，并更新当前 PR。
   ```

「发起任务」只准备 GitHub 创建页和模板，由你填写、发布；它不会自动发帖。仅修改旧正文或只在标题写指令，不会等同于发布一条新请求。

普通的同账号消息不会作为人工任务接入。自动回复使用 `<!-- dsh-superagent:… -->` 标记，请保留该标记，避免自动内容被误当作新请求。详见 [账号与部署说明](docs/006-deployment.md#accounts)。

## 安装与首次配置

需要 Node.js 22.19+ 或 24+（以 `package.json` 为准）、pnpm、Git、Python 3.8+、tmux、GitHub CLI，以及兼容版本的 DeepSeek Harness 和可用模型。macOS 桌面伴侣还需要 Swift 编译器与 AppKit。

```sh
git clone --branch codex/dsh-superagent --single-branch https://github.com/oliverran/deepseek-harness.git dsh-superagent
cd dsh-superagent
pnpm install
pnpm build
```

以上步骤只获取并构建源码。首次运行还需要创建独立 Harness profile、加载本 bundle、配置模型与 GitHub 权限。建议让编码代理执行：

> 阅读本仓库的 SETUP.md，协助我安装和配置 dsh-superagent。我希望直接使用自己的 GitHub 账号，通过 /task 指令给自己下任务。

[SETUP.md](SETUP.md) 提供引导流程；[部署文档](docs/006-deployment.md) 提供手动安装、权限说明和故障排查。该实例已完成配置时，无需重复创建 profile。

## 已配置的本地实例

此定制实例的包装脚本使用项目内 `.dsh-local` 与 `.runtime`。**新克隆的仓库不包含这两个目录**，应先完成部署和登录。

```sh
scripts/local-superagent status
scripts/local-superagent start
scripts/local-superagent stop
scripts/local-superagent restart
```

控制台默认地址为 `http://127.0.0.1:3082/`；需要认证时使用启动输出中的控制台链接。服务运行在 tmux 中，关闭终端或浏览器后仍可继续执行。Mac 必须保持开机且唤醒；重启或退出系统登录后需要重新启动。

`scripts/local-superagent` 和 `scripts/gh-agent` 包含当前机器的运行路径与代理约定，默认代理为 `http://127.0.0.1:51926`。其他机器请按实际环境调整，或通过 `DSH_SUPERAGENT_PROXY` 指定代理；不需要代理时请移除包装脚本中的代理设置。GitHub 包装脚本默认使用 `/opt/homebrew/bin/gh`。

## macOS 应用与鲸鱼娘

完成本地服务配置后执行：

```sh
scripts/desktop-pet build
scripts/desktop-pet start
```

构建会生成 `.artifacts/guang harness.app` 和项目根目录的 `guang harness.app` 快捷入口，并运行 16 项原生自检。双击应用会检查并启动服务、打开控制台、显示桌面伴侣。可将构建出的完整 `.app` 复制到「应用程序」或桌面；应用记录构建时的项目位置，移动源码目录后需重新构建并替换应用。

- 悬停打招呼，拖动时切换姿态，松开后播放落地动效；双击喂食，单击或右键打开菜单。
- 菜单栏鲸鱼支持恢复显示、尺寸调整、休息与唤醒、服务启动检查和退出。
- 关闭伴侣不会停止后台服务；隐藏、喂食、休息也不会暂停任务。
- 桌面状态反映 **Superagent** 的运行情况，不跟踪所有普通 Harness 对话。
- 应用不自动设置开机登录项。源码仓库不包含构建后的 `.app`，需要在本机生成。

更多交互与运行限制见 [桌面伴侣说明](desktop-pet/README.md)。

## 开发与验证

```sh
pnpm typecheck
pnpm test
pnpm build
# 或一次执行以上检查
pnpm check
```

本次工作台改版已通过类型检查、构建及回归测试。测试中的本地模拟服务需要允许监听回环端口；代理环境应将 `127.0.0.1` 与 `localhost` 加入 `NO_PROXY`。

## 文档

原型的设计与实现文档主要为英文，按编号阅读：

- [000 Philosophy](docs/000-philosophy.md)：减少操作者注意力消耗的原则
- [001 Domain model](docs/001-domain.md)：任务、消息与执行模型
- [002 Authorization](docs/002-authorization.md)：授权与接单
- [003 Execution](docs/003-execution.md)：执行机制
- [004 Prompts](docs/004-prompts.md)：提示词组织
- [005 Panel](docs/005-panel.md)：当前管理页面
- [006 Deployment](docs/006-deployment.md)：安装、配置、升级与排障
- [007 Architecture](docs/007-architecture.md)：代码结构
- [008 Cookbook](docs/008-cookbook.md)：扩展消息来源

## 数据与许可

Git 仓库排除了 `.env`、`.dsh-local/`、`.runtime/`、`.artifacts/`、`deploy.local.json`、`node_modules/`、`lib/` 和生成的 `guang harness.app`。这些目录可能包含凭证、会话或机器配置，迁移时需单独配置，不要提交到 GitHub。

代码使用 [MIT 许可证](LICENSE)。鲸鱼娘精灵、图标及其衍生美术使用单独的 **CC BY-NC-SA 4.0** 许可，需署名、仅限非商业使用并以相同许可分享；不适用代码的 MIT 许可。来源与角色署名见 [美术说明](assets/whale-pet-ATTRIBUTION.md)。
