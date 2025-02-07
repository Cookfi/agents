export interface TokenStats {
    address: string;
    name: string;
    symbol: string;
    image: string;
    decimals: number;
    totalBuyVolumeSol: number;
    totalSellVolumeSol: number;
    currentHoldingVolumeSol: number;
    buyCount: number;
    sellCount: number;
    uniqueWallets: Set<string>;
    uniqueWalletsCount: number;
    lastTradeTime: number;
    lastTradeTimeAgo: string;
}

export interface TopTokenResponse {
    success: boolean;
    message: string;
    data: {
        tokens: TokenStats[];
    };
}

export interface TopWalletsParams {
    timeframe?: string;
    limit?: number;
}
