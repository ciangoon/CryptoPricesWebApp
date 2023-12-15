import CoinbaseExchange from './coinbase.js';

// Dynamically populates landing page
function populateGrid(hashMap, fullNamesMap) {
    const gridContainer = document.getElementById('tradingPairsGrid');
    gridContainer.innerHTML = '';  // Clear the grid container

    Array.from(hashMap.keys()).sort().forEach(baseCurrency => {
        const ids = hashMap.get(baseCurrency);  // [BTC-USD, BTC-EUR, BTC-GBP]
        
        // Set default trading pair to show USD prices if available
        // Else show the first trading pair
        const defaultPair = ids.includes(baseCurrency + '-USD') ? baseCurrency + '-USD' : ids[0];

        // Get the full name of the currency if available
        const fullName = fullNamesMap[baseCurrency] || baseCurrency;

        // Populate the grid with currency cards
        const currencyCard = createCurrencyCard(baseCurrency, fullName, defaultPair);
        gridContainer.appendChild(currencyCard);
    });
} 

// Function to create a currency card
function createCurrencyCard(baseCurrency, fullName, defaultPair) {
    // Create the card div element
    const card = document.createElement('div');
    card.className = 'currency-card';

    // Create and append the image element
    const image = document.createElement('img');
    image.className = 'currency-image';
    image.src = `../images/${baseCurrency}.png`; // Path to the image
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

    // Event listener for when the card is clicked
    card.addEventListener('click', () => {
        window.open(`/chart.html?product_id=${defaultPair}`, '_blank');
    });

    return card;
}

// Instantiate the CoinbaseExchange class
const exchange = new CoinbaseExchange();

// Retrieve full names for each currency i.e BTC -> Bitcoin
exchange.makeAPICall('https://api.pro.coinbase.com/currencies')
  .then(data => {
    const fullNamesMap = data.reduce((map, currency) => {
      map[currency.id] = currency.name;
      return map;
    }, {});
    // Fetch trading pairs and populate the grid
    exchange.fetchTradingPairs().then(tradingPairsMap => {
        populateGrid(tradingPairsMap, fullNamesMap);
    }).catch(error => {
        console.error(error);
        // Handle the error appropriately
    });
  })
.catch(error => console.error('Error fetching currency names:', error));
