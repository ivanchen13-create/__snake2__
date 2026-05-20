# Snake2

一個現代風格的貪食蛇遊戲，支援鍵盤控制、分數保存與流暢動畫效果。

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

## Build

`npm run build`

## Preview

`npm run preview`

## GitHub Pages Deployment

此專案已配置 GitHub Actions，自動部署至 `gh-pages` 分支。

1. Push 到 `main` 分支。
2. Actions 會執行 `npm install`、`npm run build`，並將 `dist` 發佈到 `gh-pages`。

若要啟用 Pages，請在 GitHub repo 設定中將 Pages source 設為 `gh-pages` branch，根目錄。

部署網址通常為：

`https://<你的 GitHub 使用者名稱>.github.io/__snake2__/`
