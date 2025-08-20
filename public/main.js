import CoinbaseExchange from './coinbase.js';

// Appends a currency card to the grid
function addCurrencyCard(baseCurrency, fullName, defaultPair, price) {
    const gridContainer = document.getElementById('tradingPairsGrid');
    const currencyCard = createCurrencyCard(baseCurrency, fullName, defaultPair, price);
    gridContainer.appendChild(currencyCard);
}

// Fetch prices for cryptocurrencies in batches from API URL
async function fetchPricesInBatch(batch) {
    return Promise.all(batch.map(baseCurrency =>
        fetch(`https://api.exchange.coinbase.com/products/${baseCurrency}-USD/ticker`)
            .then(response => response.ok ? response.json() : Promise.reject(`Error: ${response.status}`))
            .then(data => [baseCurrency, data.price])
            .catch(error => {
                console.error(`Error fetching price for ${baseCurrency}:`, error);
                return [baseCurrency, 0]; // Return price of 0 if unavailable
            })
    ));
}

// Builds currency cards and appends them to the grid as they are fetched
async function populateGrid(tradingPairsMap, fullNamesMap, batchSize = 5) {
    const pricesMap = new Map();
    const baseCurrencies = Array.from(tradingPairsMap.keys());
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.textContent = `Loading assets 0/${baseCurrencies.length}`;
    let loadedCount = 0;

    for (let i = 0; i < baseCurrencies.length; i += batchSize) {
        const batch = baseCurrencies.slice(i, i + batchSize);
        const prices = await fetchPricesInBatch(batch);
        prices.forEach(([baseCurrency, price]) => {
            pricesMap.set(baseCurrency, price);
            const fullName = fullNamesMap[baseCurrency] || baseCurrency;
            // Sets the card to open chart in USD if available otherwise the first trading pair
            const defaultPair = tradingPairsMap.get(baseCurrency).find(p => p.endsWith('-USD')) || tradingPairsMap.get(baseCurrency)[0];
            addCurrencyCard(baseCurrency, fullName, defaultPair, price);
            loadedCount++;
            loadingIndicator.textContent = `Loading assets ... ${loadedCount}/${baseCurrencies.length}`;
        });
    }

    loadingIndicator.style.display = 'none'; // Hide loading indicator when done
    return pricesMap;
}

// Create a currency card
function createCurrencyCard(baseCurrency, fullName, defaultPair, price) {
    // Create the card div element
    const card = document.createElement('div');
    card.className = 'currency-card';
    card.setAttribute('data-full-name', fullName); // Set the full name as an attribute
    card.setAttribute('data-abbreviation', baseCurrency); // Set the abbreviation as an attribute
    card.setAttribute('data-price', price); // Set the price as attribute to sort

    // Create and append the image element
    const image = document.createElement('img');
    image.className = 'currency-image';
    image.src = `/images/${baseCurrency}.png`; // Path to the image
    image.alt = `${baseCurrency} image`; // Alt text for the image
    card.appendChild(image);

    // Create a container for the full name and abbreviation
    const textContainer = document.createElement('div');
    textContainer.className = 'currency-text';

    // Create a div for the full name
    const fullNameElement = document.createElement('div');
    fullNameElement.className = 'currency-full-name';
    fullNameElement.textContent = fullName || baseCurrency; // Use the full name if available
    card.appendChild(fullNameElement);

    // Create a div for the abbreviation
    const abbreviationElement = document.createElement('div');
    abbreviationElement.className = 'currency-abbreviation';
    abbreviationElement.textContent = baseCurrency; // Set the text content to the base currency abbreviation
    card.appendChild(abbreviationElement);

    // Append the full name and abbreviation to the text container
    textContainer.appendChild(fullNameElement);
    textContainer.appendChild(abbreviationElement);

    // Append the image and text container to the card
    card.appendChild(image);
    card.appendChild(textContainer);

    // Append the price to the text container
    const priceElement = document.createElement('div');
    priceElement.className = 'currency-price';

    // Format price to use commas as separator
    const formattedPrice = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
    }).format(price);
    priceElement.textContent = formattedPrice;
    textContainer.appendChild(priceElement);
    

    // Event listener for when the card is clicked
    card.addEventListener('click', () => {
        window.open(`/chart.html?product_id=${defaultPair}`, '_blank');
    });

    return card;
}

// Filter cards based on search box
function filterCards() {
    const searchInput = document.getElementById('site-search').value.toLowerCase();
    const cards = document.querySelectorAll('.currency-card');

    cards.forEach(card => {
      const fullName = card.getAttribute('data-full-name').toLowerCase();
      const abbreviation = card.getAttribute('data-abbreviation').toLowerCase();
      // Filter based on full name or abbreviation, if search input is empty show all cards
      if (fullName.includes(searchInput) || abbreviation.includes(searchInput) || searchInput === '') {
        card.style.display = ''; // Show the card
      } else {
        card.style.display = 'none'; // Hide the card
      }
    });
}

// Sort by dropdown list
function sortCards() {
    const sortValue = document.getElementById('sort-select').value;
    const gridContainer = document.getElementById('tradingPairsGrid');
    let cards = Array.from(gridContainer.querySelectorAll('.currency-card'));

    switch(sortValue) {
        case 'priceAsc':
            // Sort by price in ascending order
            cards.sort((a, b) => parseFloat(a.getAttribute('data-price')) - parseFloat(b.getAttribute('data-price')));
            break;
        case 'priceDesc':
            // Sort by price in descending order
            cards.sort((a, b) => parseFloat(b.getAttribute('data-price')) - parseFloat(a.getAttribute('data-price')));
            break;
        case 'alpha':
            // Alphabetical order
            cards.sort((a, b) => a.getAttribute('data-full-name').localeCompare(b.getAttribute('data-full-name')));
            break;
        case 'reverseAlpha':
            // Reverse alphabetical order
            cards.sort((a, b) => b.getAttribute('data-full-name').localeCompare(a.getAttribute('data-full-name')));
            break;
    }

    // Clear the grid and append sorted cards
    gridContainer.innerHTML = '';
    cards.forEach(card => gridContainer.appendChild(card));
}

// Event listener for the sort dropdown
document.getElementById('sort-select').addEventListener('change', sortCards);

// Event listener for the search input
document.getElementById('site-search').addEventListener('input', filterCards);

// Instantiate the CoinbaseExchange class
const exchange = new CoinbaseExchange();

// This starts loading the page as soon as it is opened
// First retrieves full names for each currency i.e BTC -> Bitcoin
exchange.makeAPICall('https://api.exchange.coinbase.com/currencies')
  .then(async data => {
    const fullNamesMap = data.reduce((map, currency) => {
      map[currency.id] = currency.name;
      return map;
    }, {});

    // Then, fetches trading pairs 
    const tradingPairsMap = await exchange.fetchTradingPairs();

    // Then, populates grid with currency cards as they are fetched
    await populateGrid(tradingPairsMap, fullNamesMap);

  })
.catch(error => console.error('Error fetching currency names:', error));
