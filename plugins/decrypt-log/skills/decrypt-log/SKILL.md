---
name: decrypt-log
description: "解密日志助手。当用户要求解密日志、decrypt log 时触发，或用户提到加密日志、日志解密等关键词时触发。"
argument-hint: <日志URL或文件路径>
disable-model-invocation: false
allowed-tools: ["mcp__plugin_decrypt-log_decrypt-log__*"]
---

# 解密日志助手

帮助用户解密 CamScanner 加密日志文件。纯本地 WASM 解密，无需浏览器、无需登录。支持 URL 下载解密和本地文件解密。

## 可用 MCP 工具

1. **decrypt-log** — 通过 URL 链接下载并解密日志
2. **decrypt-log-file** — 解密本地文件
3. **list-decrypted-files** — 列出已解密的日志文件

## 工作流程

### 解密日志

根据用户提供的输入：

- **如果是 URL 链接**（https:// 开头）：使用 `decrypt-log` 工具
- **如果是本地文件路径**：使用 `decrypt-log-file` 工具

参数说明：
- `platform`: 默认 iOS，如果用户明确说是 Android 日志则传 Android
- `output_dir`: 可选，指定保存目录，默认 ~/.decrypt-log-mcp/downloads/

### 查看已解密文件

使用 `list-decrypted-files` 列出历史解密文件。
