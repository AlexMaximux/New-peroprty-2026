const generateDiagram = require('express-router-diagram');
const express = require('express');
const app = express();
app.get('/test', (req, res) => res.send('ok'));

(async () => {
  try {
    await generateDiagram({
      router: app,
      output: './test-output.svg',
      format: 'svg'
    });
    console.log('Diagram generated');
  } catch (e) {
    console.error('Error:', e);
  }
})();
