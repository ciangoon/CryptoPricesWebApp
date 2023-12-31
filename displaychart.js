import CoinbaseExchange from "./coinbase.js";

// Define currency symbols for display
const currencySymbols = {
    "USD": "$",
    "EUR": "€",
    "BTC": "₿",
    "ETH": "Ξ",
    "GBP": "£",
    "USDC": "USDC", 
    "DAI": "DAI",
    "USDT": "₮"  
};

// Format date to fit the x-axis of the chart
function formatDate(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const day = days[date.getDay()];
    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();

    let hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM'; // Determine if it's AM or PM
    hours = hours % 12;
    hours = hours ? hours : 12; // hour '0' should be '12'
    const minutes = date.getMinutes().toString().padStart(2, '0'); // ensure minutes is two digits
    const seconds = date.getSeconds().toString().padStart(2, '0'); // ensure seconds is two digits

    return `${day}, ${month} ${dayOfMonth}, ${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
}

// Define myChart globally so can be accessed by updateChart()
let myChart;

// Initialise global granularity and start variable
// So can be accessed by both event listeners
let currentGranularity = 86400; // Default to 1 day
let currentEndDate = new Date();
let currentStartDate = new Date(currentEndDate);
currentStartDate.setFullYear(currentStartDate.getFullYear() - 1); // Default to 1 year
currentStartDate = currentStartDate.toISOString(); // Convert to ISO string

// Fetches chart data
async function fetchChartData(productId, exchange, currentGranularity, currentStartDate) {
    const candlestickData = await exchange.fetchCandlestickData(productId, currentGranularity, currentStartDate);

    // Data format is [timestamp, price_low, price_high, price_open, price_close]
    return candlestickData.map(d => ({
        x: new Date(d[0] * 1000),   // Convert UNIX timestamp to JavaScript Date object
        y: d[4]                     // Closing price
    }));
}

// Populate the coin info section
async function populateCoinInfo(baseCurrency, exchange) {
    const coinInfo = document.querySelector('.coin-info');
    coinInfo.innerHTML = '';

    // Coin Image
    const coinImage = document.createElement('img');
    coinImage.src = `../images/${baseCurrency}.png`;
    coinImage.alt = `${baseCurrency} image`;
    coinImage.className = 'coin-image';
    coinInfo.appendChild(coinImage);

    // Coin full name, retrieve from API then find the full name for the current base currency
    const fullNamesData = await exchange.makeAPICall('https://api.pro.coinbase.com/currencies');
    const fullNameData = fullNamesData.find(currency => currency.id === baseCurrency);
    const fullName = document.createElement('div');
    fullName.className = 'coin-name';
    fullName.textContent = fullNameData ? fullNameData.name : baseCurrency;
    coinInfo.appendChild(fullName);

    // Coin abbreviation
    const abbreviation = document.createElement('div');
    abbreviation.className = 'coin-abbreviation';
    abbreviation.textContent = baseCurrency;
    coinInfo.appendChild(abbreviation);
}

// Creates the drop-down list
async function fetchAndPopulateDropdown(baseCurrency, productId, exchange) {
    // Fetch trading pairs
    const responseData = await exchange.makeAPICall(`https://api.exchange.coinbase.com/products`);

    // Filter pairs that match the baseCurrency and extract quote currencies
    const quoteCurrencies = responseData
        .filter(pair => pair.base_currency === baseCurrency)
        .map(pair => pair.id.split('-')[1])
        .filter((value, index, self) => self.indexOf(value) === index);

    // Create the drop-down list
    const dropdownContainer = document.querySelector('.update-quote-currency-dropdown');
    const dropdown = document.createElement('select');
    dropdown.className = 'currency-select';

    // Populate the drop-down list so user can switch between currencies
    quoteCurrencies.forEach(quoteCurrency => {
        const option = document.createElement('option');
        option.value = quoteCurrency;
        option.textContent = quoteCurrency;
        if (productId.endsWith(quoteCurrency)) {
            option.selected = true;
        }
        dropdown.appendChild(option);
    });

    // Event listener for drop-down changes
    dropdown.addEventListener('change', function() {
        const selectedQuoteCurrency = this.value;
        const newProductId = `${baseCurrency}-${selectedQuoteCurrency}`;
        window.location.href = `/chart.html?product_id=${newProductId}`;
    });
    // Clear existing content and add the new dropdown
    dropdownContainer.innerHTML = '';
    dropdownContainer.appendChild(dropdown);
}

// Configure chart options and plugins
function setupChartOptions(processedData, quoteCurrency) {
    // Vertical Line 
    const verticalLinePlugin = {
        id: 'verticalLinePlugin',
        beforeDraw: function(chart) {
            if (chart.tooltip._active && chart.tooltip._active.length) {
                const ctx = chart.ctx;
                const x = chart.tooltip._active[0].element.x;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;
                
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#007BFF';
                ctx.setLineDash([3, 3]);
                ctx.stroke();
                ctx.restore();
            }
        }
    };

    let symbol = currencySymbols[quoteCurrency];
    
    let lastHoveredPrice = '';
    // Checks for data to avoid errors when no data for chart
    if (processedData.length === 0) {
        symbol = '';
        lastHoveredPrice = 'N/A';
    } else {
    // Set lastHoveredPrice 
        lastHoveredPrice = `${symbol} ${new Intl.NumberFormat('en-US', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 8 
        }).format(processedData[processedData.length - 1].y)}`;
    }
    // Display the price of the asset when chart renders
    document.getElementById('priceDisplay').textContent = lastHoveredPrice;

    const chartJsOptions = {
        maintainAspectRatio: true,
        responsive: true,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        const price = new Intl.NumberFormat('en-US', { 
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 8
                        }).format(context.parsed.y);
                        document.getElementById('priceDisplay').textContent = `${symbol} ${price}`;
                        return `${context.dataset.label}: ${symbol} ${price}`;
                    }
                }
            }
        },
        onHover: (event, chartElement) => {
            if (chartElement.length) {
                const chart = chartElement[0].element.chart;
                const dataIndex = chartElement[0].element.index;
                const datasetIndex = chartElement[0].element.datasetIndex;
                // Format the number with commas and at least two decimal places
                const price = new Intl.NumberFormat('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 8 
                }).format(chart.data.datasets[datasetIndex].data[dataIndex].y);
                lastHoveredPrice = `${symbol} ${price}`; // Update the last hovered price
                document.getElementById('priceDisplay').textContent = lastHoveredPrice;
            } else {
                // When not hovering over a data point, show the last hovered price
                if (lastHoveredPrice) {
                    document.getElementById('priceDisplay').textContent = lastHoveredPrice;
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 15
                }
            },
            y: {
                beginAtZero: false
            }
        }
    };

    return { verticalLinePlugin, chartJsOptions };
}

// Render the chart
async function renderChart(productId) {
    try {
        // Update the page title 
        document.title = `${productId} Chart`;

        const baseCurrency = productId.split('-')[0];
        const quoteCurrency = productId.split('-')[1];

        // Instantiate the CoinbaseExchange class to use makeAPICall() method
        const exchange = new CoinbaseExchange();

        await populateCoinInfo(baseCurrency, exchange);
        await fetchAndPopulateDropdown(baseCurrency, productId, exchange);
        const processedData = await fetchChartData(productId, exchange, currentGranularity, currentStartDate);
        const chartOptions = setupChartOptions(processedData, quoteCurrency);

        const ctx = document.getElementById('coinbaseChart').getContext('2d');
        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: processedData.map(d => formatDate(d.x)),
                datasets: [{
                    label: `${productId}`,
                    data: processedData.map(d => d.y),
                    backgroundColor: 'rgba(0, 123, 255, 0.5)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1,
                    pointRadius: 1
                }]
            },
            plugins: [chartOptions.verticalLinePlugin],
            options: chartOptions.chartJsOptions
        });
    } catch (error) {
        console.error("Error rendering chart:", error);
        // Handle the error in the UI
    }
}

// Update chart according to granularity 
async function updateChart(granularity, start) {
    // Retrieve productId from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('product_id');

    try {
        // Instantiate the CoinbaseExchange class to execute fetchCandlestickData()
        const exchange = new CoinbaseExchange();
        const candlestickData = await exchange.fetchCandlestickData(productId, granularity, start);

        // Process the data for Chart.js
        // Data format is [timestamp, price_low, price_high, price_open, price_close]
        const processedData = candlestickData.map(d => {
            return {
                x: new Date(d[0] * 1000), // Convert UNIX timestamp to JavaScript Date object
                y: d[4] // Closing price
            };
        });

        // Update chart 
        myChart.data.labels = processedData.map(d => formatDate(d.x));
        myChart.data.datasets[0].data = processedData.map(d => d.y);
        myChart.update();
        
    } catch (error) {
        console.error("Error updating chart:", error);
        // Handle the error in the UI, e.g., show an error message
    }
}

// Event listener for granularity drop-down list
document.addEventListener('DOMContentLoaded', () => {
    const granularitySelect = document.getElementById('granularitySelect');
    granularitySelect.addEventListener('change', function() {
        currentGranularity = this.value;
        // Handle the change, update the chart
        updateChart(currentGranularity, currentStartDate);
    });
});

// Event listener for date range buttons
document.addEventListener('DOMContentLoaded', () => {
    const dateRangeButtons = document.querySelectorAll('.update-date-button');

    // Iterate through each button
    dateRangeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove the active class from all buttons
            dateRangeButtons.forEach(btn => btn.classList.remove('active'));

            // Add the active class to the clicked button
            this.classList.add('active');

            const range = this.getAttribute('date-range');
            const endDate = new Date(); // Current date as end date
            let startDate;

            switch (range) {
                case '1h':
                    startDate = new Date(endDate.getTime() - 3600000); // 1 hour 
                    break;
                case '1d':
                    startDate = new Date(endDate.getTime() - 86400000); // 1 day 
                    break;
                case '1w':
                    startDate = new Date(endDate.getTime() - 604800000); // 1 week 
                    break;
                case '1m':
                    startDate = new Date(endDate);
                    startDate.setMonth(startDate.getMonth() - 1); // 1 month 
                    break;
                case '1y':
                    startDate = new Date(endDate);
                    startDate.setFullYear(startDate.getFullYear() - 1); // 1 year
                    break;
                case '5y':
                    startDate = new Date(endDate);
                    startDate.setFullYear(startDate.getFullYear() - 5); // 5 years 
                    break;
                case 'all':
                    startDate = new Date(0); // All time 
                    break;
            }
            // Format dates to the required format for API (e.g., ISO string)
            currentStartDate = startDate.toISOString();

            // Call updateChart with the new start date and current granularity value
            updateChart(currentGranularity, currentStartDate);
            // console.log("Updating chart with granularity:", currentGranularity, "and start:", startISO);
        });
    });
});

// Extract productId from the URL and executes renderChart
const productId = new URLSearchParams(window.location.search).get('product_id');
try {
    renderChart(productId);
} catch (error) {
    console.error("Error rendering chart:", error);
    // Handle the error in the UI, e.g., show an error message
}
