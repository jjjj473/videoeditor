# Video Editor

A simple Node.js based web editor for combining two videos in a 1v1 style.
Users can optionally trim the start time and duration of each video and apply additional editing tools such as cropping, vertical or horizontal layouts, and a text overlay.

## Requirements
- Node.js
- ffmpeg (already installed in this environment)

## Setup
```bash
npm install
node index.js
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

To run the automated test:
```bash
npm test
```

## Options

When uploading videos you can specify the following fields:

- `start1` / `start2`: start time offset for each video
- `duration1` / `duration2`: duration to keep from each video
- `cropx1`, `cropy1`, `cropw1`, `croph1` (and `cropx2`, ...): crop region for each video
- `layout`: `horizontal` (default) or `vertical`
- `text`: optional overlay text shown on the combined result
- `speed1` / `speed2`: playback speed for each video (default `1`)
- `filter`: apply `none`, `grayscale`, or `sepia` to the final video
- `watermark`: optional image overlay placed bottom-right
