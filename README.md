# Decrypt-Log MCP Server

用于在 Claude Code 中解密 CamScanner 加密日志的 MCP Server，支持 iOS 和 Android 平台，支持 URL 下载或本地文件解密。

## 功能

| 工具 | 说明 |
|------|------|
| `decrypt-log` | 通过 URL 下载并解密加密日志 |
| `decrypt-log-file` | 解密本地加密日志文件 |
| `list-decrypted-files` | 列出已解密的文件 |

## 安装

```bash
# 1. 添加插件市场（仅首次）
claude plugin marketplace add tianmuji/camscanner-plugins

# 2. 安装插件
claude plugin install decrypt-log@camscanner-plugins
```

安装后重启 Claude Code 即可使用。插件会自动注册 MCP Server。

### 前提条件

- Node.js >= 18

## 认证

**无需认证**，解密完全在本地完成（基于 WASM）。

## 使用示例

```
> 解密这个日志 https://webapi-file-service.intsig.net/file/download?param=xxx
> 帮我解密桌面上的日志文件
> 列出之前解密过的文件
```

## 支持的平台

- **iOS** — 默认平台
- **Android** — 通过 `platform: "Android"` 参数指定

## 输出目录

解密后的文件默认保存在 `~/.decrypt-log-mcp/downloads/`，文件名格式为 `decrypt_<原文件名>`。

## 开发者指南

### 发布新版本

```bash
# 1. 修改代码并构建
npm run build

# 2. 更新版本号并发布到 npm
npm version patch   # bug fix: 1.0.0 → 1.0.1
npm version minor   # 新功能: 1.0.0 → 1.1.0
npm version major   # 破坏性变更: 1.0.0 → 2.0.0

npm publish --registry https://registry.npmjs.org/ --access public

# 3. 推送 tag 到远端
git push && git push --tags
```

用户下次启动 Claude Code 时，`npx -y @camscanner/mcp-decrypt-log@latest` 会自动拉取新版本。
