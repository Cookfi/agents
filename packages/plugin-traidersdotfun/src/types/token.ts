export interface TokenBalance {
    amount: number;
    usdValue: number;
    costBasisNative: number;
}

export interface TokenResult {
    symbol: string;
    name: string;
    address: string;
    chainId: string;
    balance?: TokenBalance;
}
