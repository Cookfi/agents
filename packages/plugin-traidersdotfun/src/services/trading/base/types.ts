import {
    SwapParams,
    SwapResponse,
    TransferParams,
    TransferResponse
} from "../solana/types";

export interface BaseSwapParams extends SwapParams {
    networkId?: string;
}

export interface BaseSwapResponse extends SwapResponse {
    networkId: string;
}

export interface BaseTransferParams extends TransferParams {
    networkId?: string;
}

export interface BaseTransferResponse extends TransferResponse {
    networkId: string;
}
