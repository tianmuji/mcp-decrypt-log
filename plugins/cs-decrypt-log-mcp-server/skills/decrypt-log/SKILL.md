---
name: decrypt-log
description: "日志解密助手。当用户要求解密日志、处理加密日志文件时触发。触发关键词：解密日志、decrypt log、加密日志、.log 文件解密、客户端日志。也适用于用户贴了一个日志下载链接或本地 .log 文件路径让你分析的场景。"
argument-hint: <日志URL或文件路径>
disable-model-invocation: false
allowed-tools: ["mcp__plugin_cs-decrypt-log-mcp-server_decrypt-log__*"]
---

# 日志解密助手

纯本地 WASM 解密 CamScanner 加密日志，无需浏览器、无需登录。

## 使用方式

- **URL 链接** → `decrypt-log`（自动下载并解密）
- **本地文件** → `decrypt-log-file`
- **查看历史** → `list-decrypted-files`

## 参数

- `platform`: 默认 iOS。用户明确说 Android 日志时传 Android
- `output_dir`: 可选，默认 `~/.decrypt-log-mcp/downloads/`
