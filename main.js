import CoinbaseExchange from './coinbase.js';

// Dynamically populates landing page  
function populateTable(hashMap) {
    const tableBody = document.getElementById('tradingPairsTable').getElementsByTagName('tbody')[0];

    // Sort the keys of the hashMap in alphabetical order
    // so that table is identical each time
    Array.from(hashMap.keys()).sort().forEach(baseCurrency => {
        const ids = hashMap.get(baseCurrency);
        const row = document.createElement('tr');
        const codeCell = document.createElement('td');
        const chartCell = document.createElement('td');
        const select = document.createElement('select');

        // Placeholder option guides users to select a trading pair
        const placeholderOption = document.createElement('option');
        placeholderOption.textContent = "Select a pair";
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        select.appendChild(placeholderOption);

        // Populate the dropdown list
        ids.forEach(id => {
            const option = document.createElement('option');
            option.value = id;
            option.text = id;
            select.appendChild(option);
        });

        // Flag to track if select dropdown is opened
        let selectOpened = false;

        // Event listener for when the select dropdown is clicked
        select.addEventListener('click', function() {
            // If the dropdown is opened, open the chart in a new tab
            if (selectOpened) {
                const productId = this.value;
                window.open(`/chart.html?product_id=${productId}`, '_blank');
            }
            // Toggle the flag
            selectOpened = !selectOpened;
        });

        // Event listener to reset the flag when the dropdown loses focus
        select.addEventListener('blur', function() {
            selectOpened = false;
        });

        codeCell.textContent = baseCurrency;
        chartCell.appendChild(select);
        row.appendChild(codeCell);
        row.appendChild(chartCell);
        tableBody.appendChild(row);
    });
}

// Instantiate the CoinbaseExchange class
const exchange = new CoinbaseExchange();

// Fetch trading pairs and populate the table
exchange.fetchTradingPairs().then(hashMap => {
    populateTable(hashMap);
}).catch(error => {
    console.error(error);
    // Handle the error appropriately
});


