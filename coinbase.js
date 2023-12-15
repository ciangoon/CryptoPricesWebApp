import Exchange from './exchange.js';

class CoinbaseExchange extends Exchange {
    // Define global trading pairs map
    // key: base currency i.e BTC | value: array of trading pair ids [BTC-USD, BTC-EUR, BTC-GBP]
    // static globalTradingPairsMap = new Map();

    // Retrieves all available trading pairs from the API
    async fetchTradingPairs() {
        const data = await this.makeAPICall('https://api.exchange.coinbase.com/products');
        const tradingPairsMap = new Map();
        // key: base currency i.e BTC 
        // value: array of trading pair ids [BTC-USD, BTC-EUR, BTC-GBP]
        data.forEach(pair => {
            if (!tradingPairsMap.has(pair.base_currency)) {
                tradingPairsMap.set(pair.base_currency, []);
            }
            tradingPairsMap.get(pair.base_currency).push(pair.id);
        });
        return tradingPairsMap;
    }

    // Retrieves candlestick data for a given trading pair
    async fetchCandlestickData(productId, granularity, start) {
        // Calculate the number of milliseconds in one granularity unit
        const granularityMs = granularity * 1000;
        const end = new Date().toISOString();
        const startTime = new Date(start).getTime();
        const endTime = new Date(end).getTime();
        // Define the URL for the API call
        const baseUrl = `https://api.exchange.coinbase.com/products/${productId}/candles?granularity=${granularity}&start=START_PLACEHOLDER&end=END_PLACEHOLDER`;

        // Maximum time range that can be covered in one request (300 candles)
        const maxRange = granularityMs * 300;
        
        let segmentPromises = [];

        // Loop through the time range in chunks
        for (let segmentStart = startTime; segmentStart < endTime; segmentStart += maxRange) {
            let segmentEnd = Math.min(segmentStart + maxRange, endTime);
    
            const segmentStartISO = new Date(segmentStart).toISOString();
            const segmentEndISO = new Date(segmentEnd).toISOString();
            const segmentUrl = baseUrl.replace('START_PLACEHOLDER', segmentStartISO).replace('END_PLACEHOLDER', segmentEndISO);
            
            // const segmentData = await this.makeAPICall(segmentUrl);
            // Instead of awaiting here, push the promise into the array
            segmentPromises.push(this.makeAPICall(segmentUrl));
            
            // Have to reverse segmentData as API returns data in reverse chronological order :(
            // segmentData.reverse();

            // Append the data from this segment to the end of candleData
            // candleData.push(...segmentData);
            
        }
        // Resolve all segment promises in parallel
        const allSegments = await Promise.all(segmentPromises);

        let candleData = [];
        allSegments.forEach(segmentData => {
            // Reverse segmentData as API returns data in reverse chronological order
            segmentData.reverse();

            // Append the data from this segment to the end of candleData
            candleData.push(...segmentData);
        });

        return candleData;
    }   
}

// populate the hashmap
// CoinbaseExchange.prototype.fetchTradingPairs();

export default CoinbaseExchange;

