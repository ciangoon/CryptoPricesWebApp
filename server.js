// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/images', express.static('images'));

// Ensures javascript files served from 'public' directory has correct content type header
app.use('/displaychart.js', (req, res, next) => {
  res.setHeader('Content-Type', 'application/javascript');
  next();
}, express.static('displaychart.js'));

// exchange.js
app.use('/exchange.js', (req, res, next) => {
  res.setHeader('Content-Type', 'application/javascript');
  next();
}, express.static('exchange.js'));

// coinbase.js
app.use('/coinbase.js', (req, res, next) => {
  res.setHeader('Content-Type', 'application/javascript');
  next();
}, express.static('coinbase.js'));

// main.js
app.use('/main.js', (req, res, next) => {
  res.setHeader('Content-Type', 'application/javascript');
  next();
}, express.static('main.js'));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, public, 'index.html'));
});

app.get('/chart.html', (req, res) => {
  res.sendFile(path.join(__dirname, public, 'chart.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
