#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const v3_1 = require("zod/v3");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const JSZip = require('jszip');
const InitModule = require('./iscrypt-node.js');
const DOWNLOAD_DIR = path_1.default.join(os_1.default.homedir(), '.decrypt-log-mcp', 'downloads');
let wasmModule = null;
async function getModule() {
    if (wasmModule)
        return wasmModule;
    console.error('[WASM] Initializing decrypt module (downloading wasm)...');
    wasmModule = await InitModule();
    console.error('[WASM] Module ready.');
    return wasmModule;
}
function ensureDir(dir) {
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
}
async function decryptBuffer(cipherData, fileName, platform) {
    const mod = await getModule();
    const plainFilePath = 'plain_' + Date.now();
    const result = mod.decryptBufferRSAAES(cipherData, fileName, plainFilePath);
    if (!result.success) {
        throw new Error(`Decryption failed with code: ${result.code}`);
    }
    const decryptedData = Buffer.from(result.data);
    if (platform === 'iOS') {
        // iOS: decrypted file is a ZIP, unzip and decrypt each inner file
        const zip = new JSZip();
        const zips = await zip.loadAsync(decryptedData);
        const files = [];
        for (const key of Object.keys(zips.files)) {
            const file = zips.files[key];
            if (file.dir)
                continue;
            const arrayBuffer = await file.async('arraybuffer');
            const typedArray = new Uint8Array(arrayBuffer);
            const decResult = mod.decryptSingleBuffer(typedArray, file.name);
            files.push({ name: decResult.fileName, data: Buffer.from(decResult.data) });
        }
        return { files };
    }
    else {
        // Android: decrypted data is the final file
        return { files: [{ name: 'decrypt_' + fileName, data: decryptedData }] };
    }
}
// --- MCP Server ---
const server = new mcp_js_1.McpServer({
    name: 'decrypt-log-server',
    version: '1.0.0',
});
// Tool: decrypt-log
server.tool('decrypt-log', '通过 URL 解密 CamScanner 加密日志。自动下载、解密并保存到本地。支持 iOS 和 Android 日志。', {
    log_url: v3_1.z.string().describe('加密日志文件的 URL 链接'),
    platform: v3_1.z.enum(['iOS', 'Android']).optional().default('iOS').describe('日志平台，默认 iOS'),
    output_dir: v3_1.z.string().optional().describe('解密后文件的保存目录（绝对路径），默认 ~/.decrypt-log-mcp/downloads/'),
}, async ({ log_url, platform, output_dir }) => {
    const downloadPath = output_dir || DOWNLOAD_DIR;
    ensureDir(downloadPath);
    try {
        // Download encrypted file
        console.error(`[Decrypt] Downloading: ${log_url}`);
        const response = await fetch(log_url);
        if (!response.ok) {
            return { content: [{ type: 'text', text: `下载失败: HTTP ${response.status}` }] };
        }
        // Extract filename
        let filename = 'encrypted_log';
        try {
            const responseUrl = new URL(response.url);
            const disposition = responseUrl.searchParams.get('response-content-disposition');
            if (disposition) {
                const match = disposition.match(/filename\*=UTF-8''([^;\r\n"'&]+)/i);
                if (match?.[1])
                    filename = decodeURIComponent(match[1]);
            }
        }
        catch { /* ignore */ }
        if (filename === 'encrypted_log') {
            const disposition = response.headers.get('Content-Disposition');
            if (disposition) {
                const match = disposition.match(/filename\*=UTF-8''([^;\r\n"']+)/i);
                if (match?.[1])
                    filename = decodeURIComponent(match[1]);
            }
        }
        if (filename === 'encrypted_log') {
            const urlPath = new URL(log_url).pathname;
            const basename = path_1.default.basename(urlPath);
            if (basename && basename !== '/')
                filename = basename;
        }
        const arrayBuffer = await response.arrayBuffer();
        const cipherData = new Uint8Array(arrayBuffer);
        console.error(`[Decrypt] Downloaded ${filename} (${cipherData.length} bytes), decrypting...`);
        const { files } = await decryptBuffer(cipherData, filename, platform || 'iOS');
        // Save files
        if (files.length === 1) {
            const savePath = path_1.default.join(downloadPath, 'decrypt_' + filename);
            fs_1.default.writeFileSync(savePath, files[0].data);
            return {
                content: [{
                        type: 'text',
                        text: `解密成功!\n\n- 日志 URL: ${log_url}\n- 平台: ${platform}\n- 解密文件: ${savePath}\n- 文件大小: ${(files[0].data.length / 1024).toFixed(1)} KB`,
                    }],
            };
        }
        else {
            // Multiple files: pack into a ZIP
            const outZip = new JSZip();
            for (const f of files) {
                outZip.file(f.name, f.data);
            }
            const zipBuffer = await outZip.generateAsync({ type: 'nodebuffer' });
            const savePath = path_1.default.join(downloadPath, 'decrypt_' + filename.replace(/\.[^.]+$/, '') + '.zip');
            fs_1.default.writeFileSync(savePath, zipBuffer);
            let output = `解密成功!\n\n`;
            output += `- 日志 URL: ${log_url}\n`;
            output += `- 平台: ${platform}\n`;
            output += `- 解密文件: ${savePath}\n`;
            output += `- 文件大小: ${(zipBuffer.length / 1024).toFixed(1)} KB\n`;
            output += `- 包含 ${files.length} 个文件:\n`;
            for (const f of files) {
                output += `  - ${f.name} (${(f.data.length / 1024).toFixed(1)} KB)\n`;
            }
            return { content: [{ type: 'text', text: output }] };
        }
    }
    catch (err) {
        return { content: [{ type: 'text', text: `解密失败: ${err.message}` }] };
    }
});
// Tool: decrypt-log-file
server.tool('decrypt-log-file', '解密本地加密日志文件。传入本地文件路径，直接解密并保存结果。', {
    file_path: v3_1.z.string().describe('本地加密日志文件的绝对路径'),
    platform: v3_1.z.enum(['iOS', 'Android']).optional().default('iOS').describe('日志平台，默认 iOS'),
    output_dir: v3_1.z.string().optional().describe('解密后文件的保存目录（绝对路径），默认 ~/.decrypt-log-mcp/downloads/'),
}, async ({ file_path, platform, output_dir }) => {
    if (!fs_1.default.existsSync(file_path)) {
        return { content: [{ type: 'text', text: `文件不存在: ${file_path}` }] };
    }
    const downloadPath = output_dir || DOWNLOAD_DIR;
    ensureDir(downloadPath);
    try {
        const filename = path_1.default.basename(file_path);
        const cipherData = new Uint8Array(fs_1.default.readFileSync(file_path));
        console.error(`[Decrypt] Decrypting local file: ${filename} (${cipherData.length} bytes)`);
        const { files } = await decryptBuffer(cipherData, filename, platform || 'iOS');
        if (files.length === 1) {
            const savePath = path_1.default.join(downloadPath, 'decrypt_' + filename);
            fs_1.default.writeFileSync(savePath, files[0].data);
            return {
                content: [{
                        type: 'text',
                        text: `解密成功!\n\n- 源文件: ${file_path}\n- 平台: ${platform}\n- 解密文件: ${savePath}\n- 文件大小: ${(files[0].data.length / 1024).toFixed(1)} KB`,
                    }],
            };
        }
        else {
            const outZip = new JSZip();
            for (const f of files) {
                outZip.file(f.name, f.data);
            }
            const zipBuffer = await outZip.generateAsync({ type: 'nodebuffer' });
            const savePath = path_1.default.join(downloadPath, 'decrypt_' + filename.replace(/\.[^.]+$/, '') + '.zip');
            fs_1.default.writeFileSync(savePath, zipBuffer);
            let output = `解密成功!\n\n`;
            output += `- 源文件: ${file_path}\n`;
            output += `- 平台: ${platform}\n`;
            output += `- 解密文件: ${savePath}\n`;
            output += `- 文件大小: ${(zipBuffer.length / 1024).toFixed(1)} KB\n`;
            output += `- 包含 ${files.length} 个文件:\n`;
            for (const f of files) {
                output += `  - ${f.name} (${(f.data.length / 1024).toFixed(1)} KB)\n`;
            }
            return { content: [{ type: 'text', text: output }] };
        }
    }
    catch (err) {
        return { content: [{ type: 'text', text: `解密失败: ${err.message}` }] };
    }
});
// Tool: list-decrypted-files
server.tool('list-decrypted-files', '列出已解密的日志文件。', {
    output_dir: v3_1.z.string().optional().describe('查看指定目录，默认 ~/.decrypt-log-mcp/downloads/'),
}, async ({ output_dir }) => {
    const downloadPath = output_dir || DOWNLOAD_DIR;
    if (!fs_1.default.existsSync(downloadPath)) {
        return { content: [{ type: 'text', text: `目录不存在: ${downloadPath}` }] };
    }
    const files = fs_1.default.readdirSync(downloadPath)
        .map(name => {
        const filePath = path_1.default.join(downloadPath, name);
        const stat = fs_1.default.statSync(filePath);
        return { name, path: filePath, size: stat.size, mtime: stat.mtime };
    })
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    if (files.length === 0) {
        return { content: [{ type: 'text', text: `目录为空: ${downloadPath}` }] };
    }
    let output = `已解密的文件 (${downloadPath}):\n\n`;
    output += '| 文件名 | 大小 | 修改时间 |\n|---|---|---|\n';
    for (const f of files) {
        const sizeStr = f.size > 1024 * 1024
            ? `${(f.size / 1024 / 1024).toFixed(1)} MB`
            : `${(f.size / 1024).toFixed(1)} KB`;
        output += `| ${f.name} | ${sizeStr} | ${f.mtime.toLocaleString()} |\n`;
    }
    output += `\n共 ${files.length} 个文件`;
    return { content: [{ type: 'text', text: output }] };
});
// --- Start ---
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Decrypt Log MCP Server running on stdio');
}
main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
