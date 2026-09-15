# Zotero-WPSJS-Mac

Zotero 与 WPS 文字交互插件的 **macOS 修复版**，用于在 WPS 中添加、编辑引用及参考文献。

本项目由 **DreamZouz 在原作者的 Zotero-WPSJS 项目基础上修改和整理**，主要修复 macOS 下的通信、代理启动和引用操作问题。原项目及其已有代码的版权归原作者和相应贡献者所有；本仓库为独立维护的修改版，不代表原作者的官方发布。

## 项目来源与致谢

- **原项目**：[wangrui5015/Zotero-WPSJS（Gitee）](https://gitee.com/wangrui5015/Zotero-WPSJS)。
- **本次使用的上游仓库**：[bigben446/Zotero-WPSJS（GitHub）](https://github.com/bigben446/Zotero-WPSJS)，基于提交 `b1f1c9ecada3340a1d3943971b60c64b359bd535` 的 Mac 版本。
- **原项目所基于的项目**：[tankwyn/WPS-Zotero](https://github.com/tankwyn/WPS-Zotero)。
- **本修改版维护者**：[DreamZouz](https://github.com/DreamZouz)。修改日期：2026-09-15，具体内容见下文。

感谢原作者、WPS 官方技术团队及各位贡献者。本次修复也已向上述 GitHub 上游仓库提交 [PR #5](https://github.com/bigben446/Zotero-WPSJS/pull/5)。

## 适配环境

- **操作系统：macOS**。随附的 `mac安装` 与 `proxy.app` 启动程序均包含 Intel（x86_64）和 Apple Silicon（arm64）架构。
- **WPS for Mac：原项目要求 6.15 或更高版本**，且需要支持 WPS JS 加载项。本次修复记录未注明实测 WPS/macOS 具体版本。
- **Zotero：本次通信修复针对 10.0.2**；原项目说明要求 Zotero 7，其他版本的完整功能兼容性仍需实际验证。
- **Python 3：`proxy.app` 固定调用 `/usr/bin/python3`**。代理仅使用 Python 标准库，无需安装第三方 Python 包；运行前请确认该路径可用。

双架构入口不代表所有 macOS、WPS 与 Zotero 版本组合均已验证。

## 修复内容（2026-09-15）

### 1. WPS 与 Zotero 通信失败

修复记录指出，旧浏览器请求缺少 `X-Zotero-Connector-API-Version`，导致 Zotero 10.0.2 关闭请求。

- `proxy.py` 改为 Python 标准库 HTTP 中转，转发时补充 `X-Zotero-Connector-API-Version: 3`。
- 处理跨域 OPTIONS 预检、HTTP 响应状态、响应头和响应体。
- 仅监听 `127.0.0.1:21931`，将 Connector 请求转发至本机 Zotero 的 `127.0.0.1:23119`。

### 2. macOS 代理启动

- `proxy.app` 使用由 `proxy-launcher.c` 编译的原生双架构入口，定位同目录的 `proxy.py` 并运行。
- WPS 启动代理的命令加入 `open -n`，避免 Launch Services 复用已退出的中转实例。

### 3. 引用操作与光标处理

本次还对引用操作作了以下调整：

- 引用事务改为异步 XMLHttpRequest，并等待事务完成，避免 Zotero 对话框打开期间同步请求阻塞 WPS 界面/API 事件循环。
- 功能区操作增加执行中保护，避免重复点击并发触发事务；引用刷新和书签操作相应等待完成。
- 空文档无域、脚注和尾注时直接返回无引用；光标在文档起点时不再向前扩展范围。
- 增加通信及光标操作诊断，日志记录操作标签、状态、字节数和耗时，不记录文档正文或引用内容。

## 安装或更新

1. 退出 WPS。更新已有安装前，可备份下方列出的已安装插件目录；安装脚本会移除旧的 `wps-zotero` 插件目录后重新复制文件。
2. 在 Zotero 的“设置 → 高级”中勾选“允许此计算机上的其他程序与 Zotero 通信”。
3. 按原项目要求，在 WPS 的“工具 → 宏安全性 → 可靠发行商”中勾选“信任对于 wpsjs 项目的访问”（菜单名称可能因版本不同而变化）。
4. 保持本目录结构完整，打开本目录的 `mac安装`。若 macOS 提示未签名，请按原项目安装教程在“系统设置 → 隐私与安全性”中允许打开；部分系统还需对 `proxy.app` 执行一次相同操作。
5. 重新打开 Zotero 和 WPS，在空白测试文档中使用 **Add/Edit Citation**，再检查参考文献和刷新功能。

也可以在终端进入本目录后，直接运行随附安装脚本：

```bash
/usr/bin/python3 --version
/usr/bin/python3 install.py
```

若第一条命令不可用，应先准备可用的 `/usr/bin/python3`；仅在其他路径安装 Python 不会改变代理入口调用的路径。

默认安装位置：

```text
~/Library/Containers/com.kingsoft.wpsoffice.mac/Data/.kingsoft/wps/jsaddons/wps-zotero_1.0.0/
```

原版图文教程：[Mac端保姆级安装教程.docx](Mac端保姆级安装教程.docx)。该教程保留供参考，修复内容及本次适配范围以本 README 为准。

## 验证记录与排查

原始[修复说明](修复说明.txt)记录以下检查已通过：

- 模拟 WPS 的 `POST /connector/ping` 返回 200。
- OPTIONS 跨域预检返回 204。
- 代理应用正常启动、停止后再次启动。

**原记录仍要求在 WPS 中点击 Add/Edit Citation 验证实际插入。** 本次文件整理不等同于完整的端到端验证；异步事务、光标修复及不同环境组合也应通过实际文档操作确认。

若仍无法插入引用：

1. 确认 Zotero 正在运行、已允许本机程序通信，且 `/usr/bin/python3` 可用。
2. 确认安装的是本目录中的修复版，退出并重新启动 WPS。
3. 查看已安装插件目录中的 `proxy-diagnostic.log`（代理运行后生成，轮转备份为 `proxy-diagnostic.log.1`），检查通信状态与最后执行的步骤。

## 目录说明

| 文件或目录 | 用途 |
| --- | --- |
| `mac安装` / `install.py` | 安装入口与可读安装脚本 |
| `proxy.app` / `proxy.py` | macOS 代理入口与本机 HTTP 中转 |
| `proxy-launcher.c` | 原生代理入口源码 |
| `js/` | WPS 与 Zotero 交互逻辑，包含本次修复 |
| `index.html` / `main.js` / `ribbon.xml` | 加载项页面、脚本入口与功能区定义 |
| `ui/` / `images/` | 界面与图片资源 |
| `macUninstall.app` / `uninstall.py` | 原项目卸载工具 |
| `修复说明.txt` | 保留的原始修复记录；其中备份路径指原工作目录 |
| `LICENSE.txt` | 原项目许可证 |

`package.json` 与 `package-lock.json` 保留原项目开发依赖信息，普通安装无需执行 `npm install`。本仓库不包含修复前备份、Python 缓存或运行日志。

## 卸载

退出 WPS 后，在本目录运行：

```bash
/usr/bin/python3 install.py -u
```

也可使用原项目提供的 `macUninstall.app`。

## 版权与许可证

本修改版沿用原项目随附的 **GNU General Public License v3（GPLv3）**，许可证全文见 [LICENSE.txt](LICENSE.txt)。本次修改也以相同许可证发布。

- 原项目代码、署名及版权声明予以保留；本次修复和整理不改变原作者及其他贡献者对其作品的权利。
- 本仓库随附的原项目图片、安装教程等资源保留原有署名；如有单独的授权声明，以相应声明为准。
- 再分发或继续修改时，请遵守许可证要求，保留相关版权和许可声明，并提供相应源码及修改说明。

本项目按许可证以“现状”提供，不作任何担保。
