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

        // Create a card div for each base currency
        const card = document.createElement('div');
        card.className = 'currency-card';
        card.textContent = baseCurrency; // Set the text content to the base currency name

        // Add the full name to the card
        const fullName = fullNamesMap[baseCurrency] || baseCurrency; // Use the full name if available
        const nameElement = document.createElement('div');
        nameElement.textContent = fullName;
        card.appendChild(nameElement);

        // Event listener for when the card is clicked
        card.addEventListener('click', () => {
            window.open(`/chart.html?product_id=${defaultPair}`, '_blank');
        });

        gridContainer.appendChild(card);
    });
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
    exchange.fetchTradingPairs().then(hashMap => {
        populateGrid(hashMap, fullNamesMap);
    }).catch(error => {
        console.error(error);
        // Handle the error appropriately
    });
  })
.catch(error => console.error('Error fetching currency names:', error));




