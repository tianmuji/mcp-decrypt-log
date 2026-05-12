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
claude plugins marketplace add https://gitlab.intsig.net/cs-templates/skills/cs-web-agent-plugins.git

# 2. 安装插件
claude plugins install cs-decrypt-log-mcp-server@cs-web-agent-plugins
```

安装后重启 Claude Code 即可使用。插件会自动注册 MCP Server。

### 前提条件

- Claude Code >= 1.0
- Git >= 2.22（需支持 partial clone）
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

1. 修改代码并推送到 GitLab
2. 在 Jenkins 中触发构建：[public_npm](https://jenkins.intsig.net/job/public_npm/)，参考已有 mcp 相关包配置
3. 更新 marketplace.json 中的 sha

用户下次启动 Claude Code 时，`npx -y @camscanner/mcp-decrypt-log@latest` 会自动拉取新版本。
