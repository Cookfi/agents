import { CookieService } from "../cookie";
import { DexScreenerService } from "../dexscreener";


interface TokenReport {
  tickers: string[];
  marketData: any;
  addresses: string[];
  tokenNames: string[];
  scores: any;
  tweetData: {
    byTicker: any[];
    byName: any[];
    byTicker2: any[];
  };
}

export class TokenReportService {
  private dexScreener: DexScreenerService;
  private cookieService: CookieService;

  constructor() {
    this.dexScreener = new DexScreenerService({ maxTokens: 6 });
    //you can change the maxTokens to change the number of tokens in the report
    this.cookieService = new CookieService();
  }

  async generateReport(): Promise<TokenReport> {
    try {
      // Get DexScreener data
      const { tickers, marketData, addresses, tokenNames, scores } = 
        await this.dexScreener.getTrendingTokens();

      // Get Cookie data for both tickers and names
      const [tickerTweets, tickerTweets2, nameTweets] = await Promise.all([
        // Search by tickers ($BBB, etc)
        this.cookieService.searchMultipleQueries(
          tickers.map(ticker => `$${ticker}`),
          5  // max_results per query
        ),
        this.cookieService.searchMultipleQueries(
          tickers.map(ticker => `$${ticker} token`),
          5  // max_results per query
        ),


        // Search by token names
        this.cookieService.searchMultipleQueries(
          tokenNames.map(name => `"${name}"`),
          5  // max_results per query
        )
      ]);

      return {
        tickers,
        marketData,
        addresses,
        tokenNames,
        scores,
        tweetData: {
          byTicker: tickerTweets,
          byName: nameTweets,
          byTicker2: tickerTweets2
        }
      };
    } catch (error) {
      console.error('Error generating token report:', error);
      throw error;
    }
  }

  // Test function
  async testTokenReport() {
    try {
      console.log('Generating Token Report...');
      const report = await this.generateReport();
      
      // Process tweets for each ticker separately
      report.tickers.forEach(ticker => {
        // Remove $ if it exists in the ticker and then add it
        const cleanTicker = ticker.replace('$', '');
        const tickerSymbol = `$${cleanTicker}`;
        
        console.log(`\n=== All Tweets for ${tickerSymbol} ===`);
        
        // Filter ALL tweets that mention this specific ticker from all three sources
        const allTickerTweets = [
          ...report.tweetData.byTicker.filter(tweet => 
            tweet.formattedText.includes(tickerSymbol)
          ),
          ...report.tweetData.byTicker2.filter(tweet => 
            tweet.formattedText.includes(tickerSymbol)
          ),
          ...report.tweetData.byName.filter(tweet => 
            tweet.formattedText.includes(tickerSymbol)
          )
        ];
        
        // Display all tweets for this ticker
        console.log(`\nFound ${allTickerTweets.length} tweets containing ${tickerSymbol}:`);
        allTickerTweets.forEach((tweet, index) => {
          console.log(`\n[Tweet ${index + 1}]`);
          console.log(`Text: ${tweet.formattedText}`);
          console.log(`Score: ${tweet.score}`);
          console.log(`Engagement: ${tweet.formattedEngagement}`);
          console.log('------------------------');
        });
      });
      
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  const service = new TokenReportService();
  service.testTokenReport();
}
