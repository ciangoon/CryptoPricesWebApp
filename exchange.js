// Base class for exchanges
class Exchange {
    // Makes API call and returns response, tries 3 times before throwing error
    async makeAPICall(url, retryCount = 3) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch data:", error);
            if (retryCount > 0) {
                console.log(`Retrying... Attempts remaining: ${retryCount}`);
                return await this.makeAPICall(url, retryCount - 1);
            } else {
                throw new Error("Max retries reached. Failed to fetch data.");
            }
        }
    }

    async fetchTradingPairs() {
        throw new Error("fetchTradingPairs() method must be implemented");
    }

    async fetchCandlestickData() {
        throw new Error("fetchCandlestickData() method must be implemented");
    }
    
    // Add more common methods or properties if required
    // i.e fetch order book, place order, cancel order 
}

export default Exchange;
