# 超慢跑節拍器

手機優先的超慢跑二拍節拍器，放到 GitHub Pages 後可用手機瀏覽器開啟。

## 功能

- 每分鐘 160 到 200 步頻設定，支援滑桿、+/-10、+/-1 與 160/180/200 快速設定。
- 0 到 60 分鐘計時，0 分鐘代表不倒數、持續播放。
- 開始、暫停、停止控制。
- 二拍循環：第 1 拍較明顯，第 2 拍較輕，適合左右腳交替。
- 四種節拍音色：木魚、金屬銅鈴、玻璃風鈴、陶器鐵琴。
- 可按「語音調整」後說「快一點」讓步頻 +10，說「慢一點」讓步頻 -10。
- 可按「免持模式」開啟持續語音控制，運動中不用再碰螢幕。
- 倒數結束時播放三聲提示音。
- 介面採緊湊滿版設計，方便放進手機全螢幕。

## 使用

用手機瀏覽器開啟 `index.html`。第一次按下開始或切換音色時，瀏覽器會允許網頁啟用音訊。語音調整與免持模式需要瀏覽器支援 Web Speech API，並允許麥克風權限。

## 放到 GitHub Pages

1. 到 GitHub 建立一個新 repository，例如 `slow-jog-metronome`。
2. 上傳本資料夾內的所有檔案，讓 `index.html` 位在 repository 根目錄。
3. 進入 repository 的 `Settings`。
4. 左側選 `Pages`。
5. `Build and deployment` 的來源選 `Deploy from a branch`。
6. Branch 選 `main`，資料夾選 `/root`，按 `Save`。
7. 等待 GitHub Pages 建置完成，頁面會顯示網址，通常是 `https://你的帳號.github.io/slow-jog-metronome/`。

## 離線檔案

- `sw.js`：離線快取，讓已開過的頁面可離線使用。
- `icons/icon.svg`、`icons/icon-192.png`、`icons/icon-512.png`：主畫面圖示。
- `.nojekyll`：讓 GitHub Pages 直接發布靜態檔案。

## 麥克風提醒

- 免持模式會先要求麥克風權限，再啟動語音辨識。
- 若瀏覽器不支援 Web Speech API，語音調整無法使用；Android Chrome 支援度較佳。
