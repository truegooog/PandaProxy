const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const path = require('path');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/proxy', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).send('Please provide a URL.');
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36',
      },
    });

    const modifiedContent = modifyLinks(response.data, url);
    res.send(modifiedContent);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error fetching or displaying data from the URL.');
  }
});

function modifyLinks(htmlContent, baseUrl) {
  const $ = cheerio.load(htmlContent, { decodeEntities: false });
  $('a').each(function () {
    const href = $(this).attr('href');
    if (href && href.startsWith('http')) {
      const modifiedUrl = new URL(href, baseUrl).toString();
      $(this).attr('target', '_blank');
      $(this).attr('href', `/proxy?url=${encodeURIComponent(modifiedUrl)}`);
    }
  });
  // Adjust other resource URLs like <img>, <script>, <link>, etc. if needed

  return $.html();
}

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
