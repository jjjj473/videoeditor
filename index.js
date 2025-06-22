const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post(
  '/upload',
  upload.fields([{ name: 'left' }, { name: 'right' }, { name: 'watermark' }]),
  (req, res) => {
    const left = req.files['left'] ? req.files['left'][0] : null;
    const right = req.files['right'] ? req.files['right'][0] : null;
    const watermarkFile = req.files['watermark'] ? req.files['watermark'][0] : null;
  if (!left || !right) {
    return res.status(400).send('Two video files required.');
  }

  const {
    start1 = '',
    duration1 = '',
    start2 = '',
    duration2 = '',
    layout = 'horizontal',
    text = '',
    speed1 = '1',
    speed2 = '1',
    filter = 'none',
    cropx1 = '',
    cropy1 = '',
    cropw1 = '',
    croph1 = '',
    cropx2 = '',
    cropy2 = '',
    cropw2 = '',
    croph2 = ''
  } = req.body;

  const leftOpts = `${start1 ? `-ss ${start1}` : ''} ${duration1 ? `-t ${duration1}` : ''}`.trim();
  const rightOpts = `${start2 ? `-ss ${start2}` : ''} ${duration2 ? `-t ${duration2}` : ''}`.trim();

  const output = path.join('outputs', `${Date.now()}_combined.mp4`);
  fs.mkdirSync('outputs', { recursive: true });

  const filters = [];
  let leftLabel = '[0:v]';
  let rightLabel = '[1:v]';
  if (cropw1 && croph1) {
    filters.push(`[0:v]crop=${cropw1}:${croph1}:${cropx1 || 0}:${cropy1 || 0}[leftv]`);
    leftLabel = '[leftv]';
  }
  if (cropw2 && croph2) {
    filters.push(`[1:v]crop=${cropw2}:${croph2}:${cropx2 || 0}:${cropy2 || 0}[rightv]`);
    rightLabel = '[rightv]';
  }

  if (speed1 && speed1 !== '1') {
    filters.push(`${leftLabel}setpts=PTS/${speed1}[lspd]`);
    leftLabel = '[lspd]';
  }
  if (speed2 && speed2 !== '1') {
    filters.push(`${rightLabel}setpts=PTS/${speed2}[rspd]`);
    rightLabel = '[rspd]';
  }

  const stackFilter = `${leftLabel}${rightLabel}${layout === 'vertical' ? 'vstack=inputs=2' : 'hstack=inputs=2'}[stacked]`;
  filters.push(stackFilter);

  let currentLabel = '[stacked]';

  if (filter === 'grayscale') {
    filters.push(`[stacked]hue=s=0[filtered]`);
    currentLabel = '[filtered]';
  } else if (filter === 'sepia') {
    filters.push(`[stacked]colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131[filtered]`);
    currentLabel = '[filtered]';
  }

  if (text) {
    const safeText = text.replace(/'/g, "\\'");
    filters.push(`${currentLabel}drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:text='${safeText}':fontcolor=white:fontsize=24:x=(w-text_w)/2:y=h-text_h-10[textv]`);
    currentLabel = '[textv]';
  }

  if (watermarkFile) {
    filters.push(`${currentLabel}[2:v]overlay=W-w-10:H-h-10[watermarked]`);
    currentLabel = '[watermarked]';
  }

  const outLabel = currentLabel;

  const filterComplex = filters.join('; ');
  const watermarkInput = watermarkFile ? ` -i ${watermarkFile.path}` : '';
  const cmd = `ffmpeg ${leftOpts} -i ${left.path} ${rightOpts} -i ${right.path}${watermarkInput} -filter_complex "${filterComplex}" -map "${outLabel}" -c:v libx264 -crf 23 -preset veryfast ${output}`;
  exec(cmd, (error, stdout, stderr) => {
    fs.unlinkSync(left.path);
    fs.unlinkSync(right.path);
    if (watermarkFile) fs.unlinkSync(watermarkFile.path);
    if (error) {
      console.error(stderr);
      return res.status(500).send('Error processing video');
    }
    res.download(output, err => {
      if (err) console.error(err);
      fs.unlinkSync(output);
    });
  });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
