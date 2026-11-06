# 日文 → 中文 精準翻譯外掛

一行 `<script>` 就能裝到任何網站的日中翻譯工具，使用 Claude（`claude-opus-5-5`，高思考強度）翻譯，重視**忠實、不漏譯、語氣與敬語正確**。

## 功能
- **選取翻譯**：在網頁上選取日文 → 出現「翻譯」小按鈕 → 彈出譯文（可複製）
  - 只含漢字的選取（可能是中文）只有在 `lang="ja"` 的元素內才會出現按鈕
- **浮動翻譯面板**：右下角「譯」按鈕，貼上整段日文翻譯（Ctrl/⌘+Enter 送出）
- 繁體（台灣用語）／简体 可切換
- **專有名詞表** `glossary.json`：固定人名、術語的譯法
- 伺服器端快取相同句子、每 IP 速率限制、來源網域白名單
- Shadow DOM，不會和網站原本的 CSS 互相影響

## 架構
```
網站 ──(jp-zh-translator.js)──► 你的伺服器 server.mjs ──► Claude API
```
API Key 只放在伺服器，**不能**直接寫在網頁裡（任何人都看得到）。

## 安裝步驟

### 1. 啟動翻譯伺服器（Node.js 18+）
```bash
cd translator
npm install
cp .env.example .env     # 填入 ANTHROPIC_API_KEY 與你的網站網址 ALLOWED_ORIGINS
npm start                # 預設 http://localhost:8787
```
可部署到 Render、Railway、Fly.io、VPS 等任何能跑 Node 的地方。

### 2. 在網站加一行
```html
<script src="https://你的伺服器網址/jp-zh-translator.js"
        data-endpoint="https://你的伺服器網址/api/translate"
        data-target="zh-Hant" defer></script>
```
（伺服器本身就會提供 `/jp-zh-translator.js`，也可以把檔案複製到自己的網站。）

| 屬性 | 預設 | 說明 |
|---|---|---|
| `data-endpoint` | 與 script 同網域的 `/api/translate` | 翻譯 API 網址 |
| `data-target` | `zh-Hant` | `zh-Hant` 繁體 / `zh-Hans` 简体 |
| `data-selection` | `true` | 選取文字時顯示翻譯按鈕 |
| `data-button` | `true` | 顯示右下角浮動按鈕 |
| `data-position` | `right` | 浮動按鈕位置 `right` / `left` |

### 3. 用 JavaScript 呼叫（選用）
```js
const zh = await JpZhTranslator.translate("お疲れ様です");
JpZhTranslator.open("預先填入的日文");
```

## API
`POST /api/translate`
```json
{ "text": "日文", "target": "zh-Hant", "context": "（選填）上下文，提升精準度" }
```
回應：`{ "translation": "中文", "truncated": false }`

## 測試
打開 `demo.html`（伺服器需在 localhost:8787 執行）。

## 費用提醒
每次翻譯都會使用你的 Anthropic API 額度。伺服器已內建快取（相同句子不重複計費）與速率限制，建議 `ALLOWED_ORIGINS` 只填你自己的網域。
