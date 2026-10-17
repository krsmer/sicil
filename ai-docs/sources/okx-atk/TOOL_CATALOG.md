# OKX ATK — MCP tool catalog (generated)

Generated 2026-10-15T11:22:12.232Z from `okx-trade-mcp@1.4.8 --modules all` via MCP listTools (no API key configured).
Tool count: 168. Each entry: name, description, required params, all params. `[CAUTION]`-type tools move funds.

## market (20)

### `market_get_ticker` · read-only
Get ticker data for a single instrument.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT, BTC-USDT-SWAP |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_tickers` · read-only
Get ticker data for all instruments of a given type.

| param | type | req | description |
|---|---|---|---|
| instType | SPOT\|SWAP\|FUTURES\|OPTION\|MARGIN\|EVENTS | ✓ |  |
| uly | string |  | Underlying, e.g. BTC-USD. Required for OPTION |
| instFamily | string |  | e.g. BTC-USD |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_orderbook` · read-only
Get the order book (bids/asks) for an instrument.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| sz | number |  | Depth per side, default 1, max 400 |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_candles` · read-only
Get candlestick (OHLCV) data for an instrument. Automatically retrieves historical data (back to 2021) when requesting older time ranges. Use the `after` parameter to paginate back in time (the old `history` parameter has been removed). IMPORTANT: Before fetching with `after`/`before`, estimate the number of candles: time_range_ms / bar_interval_ms. If the estimate exceeds ~500 candles, inform the user of the estimated count and ask for confirmation before proceeding.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| bar | 1m\|3m\|5m\|15m\|30m\|1H\|2H\|4H\|6H\|12H\|1D\|2D\|3D\|1W\|1M\|3M |  | Default 1m |
| after | string |  | Pagination: before this timestamp (ms) |
| before | string |  | Pagination: after this timestamp (ms) |
| limit | number |  | Max results (default 100) |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_instruments` · read-only
Get tradable instruments for a given type. Returns contract specs: min order size, lot size, tick size, contract value, settlement currency, listing/expiry time. Essential before placing orders.

| param | type | req | description |
|---|---|---|---|
| instType | SPOT\|SWAP\|FUTURES\|OPTION\|MARGIN\|EVENTS | ✓ |  |
| instId | string |  | Filter by ID, e.g. BTC-USDT-SWAP |
| uly | string |  | Required for OPTION, e.g. BTC-USD |
| instFamily | string |  | e.g. BTC-USD |
| seriesId | string |  | Required for EVENTS type, e.g. BTC-ABOVE-DAILY |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_funding_rate` · read-only
Get funding rate for a perpetual SWAP instrument. IMPORTANT: instId must end with -SWAP (e.g. BTC-USDT-SWAP). Spot IDs like BTC-USDT are NOT valid. history=false (default): current rate + next estimated rate; history=true: historical rates.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | Perpetual swap instrument ID, must end with -SWAP (e.g. BTC-USDT-SWAP). Spot IDs like BTC-USDT will be rejected. |
| history | boolean |  | true=fetch historical rates |
| after | string |  | Pagination (history): before this timestamp (ms) |
| before | string |  | Pagination (history): after this timestamp (ms) |
| limit | number |  | History records (default 20, max 100) |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_mark_price` · read-only
Get mark price for SWAP, FUTURES, or MARGIN instruments. Used for liquidation calculations and unrealized PnL.

| param | type | req | description |
|---|---|---|---|
| instType | MARGIN\|SWAP\|FUTURES\|OPTION | ✓ |  |
| instId | string |  | e.g. BTC-USDT-SWAP |
| uly | string |  | e.g. BTC-USD |
| instFamily | string |  |  |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_trades` · read-only
Get recent trades for an instrument. Default 20 records, max 500.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| limit | number |  | Default 20, max 500 |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_index_ticker` · read-only
Get index ticker data (e.g. BTC-USD, ETH-USD index prices). Independent of any single exchange.

| param | type | req | description |
|---|---|---|---|
| instId | string |  | e.g. BTC-USD. Omit for all indices |
| quoteCcy | string |  | e.g. USD or USDT |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_index_candles` · read-only
Get candlestick data for an index (e.g. BTC-USD index). history=false: recent up to 1440 bars; history=true: older data.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | Index ID, e.g. BTC-USD |
| bar | 1m\|3m\|5m\|15m\|30m\|1H\|2H\|4H\|6H\|12H\|1D\|2D\|3D\|1W\|1M\|3M |  | Default 1m |
| after | string |  | Pagination: before this timestamp (ms) |
| before | string |  | Pagination: after this timestamp (ms) |
| limit | number |  | Max results (default 100) |
| history | boolean |  | true=older historical data |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_price_limit` · read-only
Get the current price limit (upper and lower bands) for a SWAP or FUTURES instrument. Orders outside these limits will be rejected.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | SWAP or FUTURES ID, e.g. BTC-USDT-SWAP |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_open_interest` · read-only
Get open interest for SWAP, FUTURES, or OPTION instruments. Useful for gauging market sentiment and positioning.

| param | type | req | description |
|---|---|---|---|
| instType | SWAP\|FUTURES\|OPTION | ✓ |  |
| instId | string |  | e.g. BTC-USDT-SWAP |
| uly | string |  | e.g. BTC-USD |
| instFamily | string |  |  |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_stock_tokens` · read-only
[Deprecated: use market_get_instruments_by_category with instCategory="3" instead] Get all stock token instruments (instCategory=3). Stock tokens track real-world stock prices on OKX (e.g. AAPL-USDT-SWAP).

| param | type | req | description |
|---|---|---|---|
| instType | SPOT\|SWAP |  | Instrument type. Default: SWAP |
| instId | string |  | Optional: filter by specific instrument ID, e.g. AAPL-USDT-SWAP |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_get_instruments_by_category` · read-only
Discover tradeable instruments by asset category. Stock tokens (instCategory=3, e.g. AAPL-USDT-SWAP, TSLA-USDT-SWAP), Metals (4, e.g. XAUUSDT-USDT-SWAP for gold), Commodities (5, e.g. OIL-USDT-SWAP for crude oil), Forex (6, e.g. EURUSDT-USDT-SWAP for EUR/USD), Bonds (7, e.g. US30Y-USDT-SWAP for crude oil). Use this to find instIds before querying prices or placing orders. Filters client-side by instCategory.

| param | type | req | description |
|---|---|---|---|
| instCategory | 3\|4\|5\|6\|7 | ✓ | Asset category: 3=Stock tokens, 4=Metals, 5=Commodities, 6=Forex, 7=Bonds |
| instType | SPOT\|SWAP |  | Instrument type. Default: SWAP |
| instId | string |  | Optional: filter by specific instrument ID |
| demo | boolean |  | Query simulated trading (demo) market data. Default: false (live market data). |

### `market_filter` · read-only
Screen / rank instruments across SPOT, SWAP, or FUTURES by multi-dimensional criteria: price range, 24h change %, market cap, 24h volume (USD), funding rate (SWAP), open interest (USD), listing time. Returns ranked rows with full ticker snapshot. Use to find top movers, high-OI contracts, newly listed tokens, etc. No credentials required. Do NOT use to get OI change rankings across contracts - use market_filter_oi_change instead. Do NOT use to get OI time series for a single instrument - use market_get_oi_history instead.

| param | type | req | description |
|---|---|---|---|
| instType | SPOT\|SWAP\|FUTURES | ✓ | Instrument type to scan. OPTION is not supported. |
| baseCcy | string |  | Filter by base currency, e.g. BTC |
| quoteCcy | string |  | Filter by quote currency. Comma-separated list supported, e.g. USDT or USDT,USDC |
| settleCcy | string |  | Filter by settlement currency (SWAP/FUTURES only), e.g. USDT |
| instFamily | string |  | Filter by instrument family (SWAP/FUTURES only), e.g. BTC-USD |
| ctType | linear\|inverse |  | Contract type filter (SWAP/FUTURES only): linear or inverse |
| minLast | string |  | Minimum last price (USD), e.g. 10000 |
| maxLast | string |  | Maximum last price (USD), e.g. 100000 |
| minChg24hPct | string |  | Minimum 24h price change %, e.g. -5 means -5% |
| maxChg24hPct | string |  | Maximum 24h price change %, e.g. 10 means 10% |
| minMarketCapUsd | string |  | Minimum market cap in USD (SPOT only; ignored for SWAP/FUTURES) |
| maxMarketCapUsd | string |  | Maximum market cap in USD (SPOT only; ignored for SWAP/FUTURES) |
| minVolUsd24h | string |  | Minimum 24h volume in USD |
| maxVolUsd24h | string |  | Maximum 24h volume in USD |
| minFundingRate | string |  | Minimum funding rate (SWAP only), e.g. 0.0001 |
| maxFundingRate | string |  | Maximum funding rate (SWAP only), e.g. 0.001 |
| minOiUsd | string |  | Minimum open interest in USD |
| maxOiUsd | string |  | Maximum open interest in USD |
| sortBy | last\|chg24hPct\|marketCapUsd\|volUsd24h\|fundingRate\|oiUsd\|listTime |  | Sort field. Default: volUsd24h. Note: marketCapUsd is only meaningful for SPOT (null for SWAP/FUTURES). To rank by OI *change* (oiDeltaPct / absOiDeltaPct), use market_filter_oi_change - market_filter only sorts by the current snapshot. |
| sortOrder | asc\|desc |  | Sort order: asc or desc. Default: desc |
| limit | number |  | Max results to return (default 20, max 100) |

### `market_get_oi_history` · read-only
Get open interest (OI) history time series for a single SWAP or FUTURES instrument. Returns per-bar OI in contracts, base currency and USD, plus bar-over-bar delta and delta %. Useful for tracking how OI evolves around price moves. No credentials required. Do NOT use to compare OI changes across multiple contracts - use market_filter_oi_change instead. Do NOT use to screen instruments by current OI level - use market_filter instead.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | Instrument ID, e.g. BTC-USDT-SWAP |
| bar | 5m\|15m\|1H\|4H\|1D |  | Bar size: 5m, 15m, 1H, 4H, 1D. Default: 1H |
| limit | number |  | Number of data points to return (default 50, max 500) |
| ts | number |  | Return bars with timestamp <= this value (Unix ms). Used for historical pagination. |

### `market_filter_oi_change` · read-only
Find SWAP or FUTURES instruments with significant open interest changes over a given bar window. Returns ranked rows with current OI (USD), previous OI (USD), OI delta (USD and %), price change %, 24h volume and funding rate. Ideal for spotting unusual accumulation/distribution or confirming trend momentum. No credentials required. Do NOT use to get OI time series for a single instrument - use market_get_oi_history instead. Do NOT use to screen by current OI absolute level or other non-OI metrics - use market_filter instead.

| param | type | req | description |
|---|---|---|---|
| instType | SWAP\|FUTURES | ✓ | Instrument type: SWAP or FUTURES |
| bar | 5m\|15m\|1H\|4H\|1D |  | Bar window for OI change computation: 5m, 15m, 1H, 4H, 1D (case-insensitive on server, but send canonical form here). Default: 1H |
| minOiUsd | string |  | Minimum current OI in USD (filters small/illiquid contracts) |
| minVolUsd24h | string |  | Minimum 24h volume in USD (filters low-activity contracts) |
| minAbsOiDeltaPct | string |  | Minimum absolute OI change % threshold, e.g. 1.0 means \|oiDeltaPct\| >= 1.0% |
| sortBy | oiUsd\|oiDeltaUsd\|oiDeltaPct\|absOiDeltaPct\|volUsd24h\|fundingRate\|last |  | Sort field. Default: oiDeltaPct (largest movers first, signed - longs and shorts separate). Use absOiDeltaPct to sort by \|oiDeltaPct\| (largest-magnitude moves regardless of direction). fundingRate is also supported for SWAP. Do NOT use the market_filter tool's sort fields (chg24hPct, marketCapUsd, listTime) here - they are not in the OI-change Row. |
| sortOrder | asc\|desc |  | Sort order: asc or desc. Default: desc |
| limit | number |  | Max results to return (default 20, max 100) |

### `market_get_pair_spread` · read-only
Compute spread statistics between two instruments over a lookback window. Returns absolute and ratio spread (mean / stdDev / median / min / max) plus an optional realtime spread snapshot. Use to size pairs trades, detect mean-reversion setups, or compare cross-listed contracts. Results are cached ~60s per (pair, bar, window) tuple. Read-only, no credentials required.
Do NOT use to fetch raw candles (use market_get_candles) or single-instrument OI/funding (use market_get_oi_history / market_filter_oi_change).

| param | type | req | description |
|---|---|---|---|
| instIdA | string | ✓ | First instrument ID, e.g. BTC-USDT-SWAP |
| instIdB | string | ✓ | Second instrument ID; must differ from instIdA |
| bar | 5m\|15m |  | Bar size for the spread series. Default 15m. 1m is not supported. |
| window | string |  | Lookback window. Format <n><unit>, units m/H/D/W (case-sensitive), max 1W. Default 1W. |
| backtestTime | number |  | Anchor timestamp (ms epoch) for backtest mode. When provided, realtime is omitted. |

### `market_get_indicator` · read-only
Get technical indicator values for an instrument. Common indicators: ma, ema, rsi, macd, bb (Bollinger), kdj, supertrend, ahr999. Call market_list_indicators first to see all valid names. No credentials required.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | Instrument ID, e.g. BTC-USDT |
| indicator | string | ✓ | Indicator name (case-insensitive), e.g. 'rsi', 'macd', 'bb', 'ma', 'ema', 'kdj', 'supertrend'. Call market_list_indicators to see all valid names. Using an invalid name will return an error. |
| bar | 3m\|5m\|15m\|1H\|4H\|12Hutc\|1Dutc\|3Dutc\|1Wutc |  | Timeframe. Default: 1H |
| params | array |  | Indicator-specific parameters as a number array. Examples: MA/EMA [14] (period), MACD [12,26,9] (fast,slow,signal), BB [20,2] (period,stdDev), RSI [14] (period). For period-based indicators a parameter is required; the CLI applies a sensible default when omitted. |
| returnList | boolean |  | Return a historical list instead of the latest value only. Default: false |
| limit | integer |  | Number of historical records to return (only used when returnList=true). Default: 10 |
| backtestTime | integer |  | Backtest timestamp in milliseconds. Omit for live (real-time) mode |

### `market_list_indicators` · read-only
List all supported technical indicator names and descriptions. Call this before market_get_indicator to discover valid indicator names. No credentials required.

## spot (14)

### `spot_place_order` · WRITE
Place a spot order. Attach TP/SL via tpTriggerPx/slTriggerPx. [CAUTION] Executes real trades.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| tdMode | cash\|cross\|isolated | ✓ | cash=regular spot, cross/isolated=margin |
| side | buy\|sell | ✓ |  |
| ordType | market\|limit\|post_only\|fok\|ioc | ✓ | market(no px)\|limit(px req)\|post_only(maker)\|fok(all-or-cancel)\|ioc(partial fill) |
| sz | string | ✓ | Buy market: quote amount, all others: base amount |
| tgtCcy | base_ccy\|quote_ccy |  | Size unit. base_ccy(default): sz in base (e.g. BTC), quote_ccy: sz in quote (e.g. USDT) |
| px | string |  | Required for limit/post_only/fok/ioc |
| clOrdId | string |  | Client order ID (max 32 chars) |
| tpTriggerPx | string |  | TP trigger price |
| tpOrdPx | string |  | TP order price, -1=market |
| tpOrdKind | condition\|limit |  | condition(default)=trigger-based TP; limit=immediate limit order (no trigger phase) |
| tpTriggerPxType | last\|index\|mark |  | TP trigger price source: last(default)\|index\|mark |
| slTriggerPx | string |  | SL trigger price |
| slOrdPx | string |  | SL order price, -1=market |
| slTriggerPxType | last\|index\|mark |  | SL trigger price source: last(default)\|index\|mark |
| stpMode | cancel_maker\|cancel_taker\|cancel_both |  | Self-trade prevention: cancel_maker\|cancel_taker\|cancel_both |

### `spot_cancel_order` · WRITE
Cancel an unfilled spot order.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| ordId | string |  |  |
| clOrdId | string |  |  |

### `spot_amend_order` · WRITE
Amend an unfilled spot order (modify price or size). To modify attached TP/SL, use the corresponding algo amend tool: spot_amend_algo_order (spot), swap_amend_algo_order (swap), futures_amend_algo_order (futures), option_amend_algo_order (option). Use spot_get_algo_orders to find the algoId for spot orders.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| ordId | string |  |  |
| clOrdId | string |  |  |
| newSz | string |  | New size in base currency |
| newPx | string |  | New price |
| newClOrdId | string |  | Replacement client order ID |

### `spot_get_orders` · read-only
Query spot orders. status: open(active)|history(7d)|archive(3mo).

| param | type | req | description |
|---|---|---|---|
| status | open\|history\|archive |  |  |
| instId | string |  | Instrument ID filter |
| ordType | string |  | Order type filter |
| state | string |  | canceled\|filled |
| after | string |  | Cursor: older than this order ID |
| before | string |  | Cursor: newer than this order ID |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100) |

### `spot_place_algo_order` · WRITE
Place a spot algo order. [CAUTION] Executes real trades. conditional: single TP/SL. oco: TP+SL pair. move_order_stop: trailing stop. trigger: pending order at triggerPx. chase: follow best bid/ask. iceberg: split large order into child orders. twap: time-weighted split.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| tdMode | cash\|cross\|isolated |  | cash(default)=spot, cross/isolated=margin |
| side | buy\|sell | ✓ |  |
| ordType | conditional\|oco\|move_order_stop\|trigger\|chase\|iceberg\|twap | ✓ | conditional=single TP/SL, oco=TP+SL pair, move_order_stop=trailing stop, trigger=pending order, chase=follow best bid/ask, iceberg=split order, twap=time-weighted split |
| sz | string | ✓ | Quantity in base currency |
| tpTriggerPx | string |  | TP trigger price (conditional/oco only) |
| tpOrdPx | string |  | TP order price, -1=market (conditional/oco only) |
| tpOrdKind | condition\|limit |  | condition(default)=trigger-based TP; limit=immediate limit order (no trigger phase) |
| tpTriggerPxType | last\|index\|mark |  | TP trigger price source: last(default)\|index\|mark |
| slTriggerPx | string |  | SL trigger price (conditional/oco only) |
| slOrdPx | string |  | SL order price, -1=market (conditional/oco only) |
| slTriggerPxType | last\|index\|mark |  | SL trigger price source: last(default)\|index\|mark |
| stpMode | cancel_maker\|cancel_taker\|cancel_both |  | Self-trade prevention: cancel_maker\|cancel_taker\|cancel_both |
| algoClOrdId | string |  | Client-assigned algo order ID (1-32 alphanumeric chars). Legacy alias clOrdId is also accepted. |
| tgtCcy | base_ccy\|quote_ccy |  | Size unit. base_ccy(default): sz in base (e.g. BTC), quote_ccy: sz in quote (e.g. USDT) |
| callbackRatio | string |  | Callback ratio e.g. 0.01=1%, use ratio or spread (move_order_stop only) |
| callbackSpread | string |  | Callback spread in price units, use ratio or spread (move_order_stop only) |
| activePx | string |  | Activation price, trailing starts when market hits this (move_order_stop only) |
| triggerPx | string |  | Activation price; order submits when market hits this level (trigger only) |
| orderPx | string |  | Order price submitted when trigger fires; -1=market (trigger only) |
| advanceOrdType | fok\|ioc |  | Execution qualifier for triggered order: fok=fill-or-kill, ioc=immediate-or-cancel (trigger only) |
| triggerPxType | last\|index\|mark |  | Price type used to evaluate trigger: last(default)\|index\|mark (trigger only) |
| chaseType | distance\|ratio |  | Chase unit: distance=price ticks, ratio=proportion of price (chase only, default distance) |
| chaseVal | string |  | Chase amount matching chaseType (e.g. 0.5 ticks for distance, 0.001 for ratio) (chase only) |
| maxChaseType | distance\|ratio |  | Upper-bound unit for chase (chase only) |
| maxChaseVal | string |  | Upper-bound value for chase (chase only) |
| pxVar | string |  | Price variance % [0.0001, 0.01]; provide pxVar OR pxSpread (iceberg/twap only) |
| pxSpread | string |  | Price variance constant >= 0; provide pxVar OR pxSpread (iceberg/twap only) |
| szLimit | string |  | Average per-child-order size (iceberg/twap only) |
| pxLimit | string |  | Order price ceiling >= 0 (iceberg/twap only) |
| timeInterval | string |  | Seconds between child orders (iceberg/twap only) |

### `spot_amend_algo_order` · WRITE
Amend a pending spot algo order (modify TP/SL prices or size). Also covers TP/SL orders attached when placing the main order - look up algoId via spot_get_algo_orders first.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| algoId | string | ✓ |  |
| newSz | string |  | New size in base currency |
| newTpTriggerPx | string |  | New TP trigger price |
| newTpOrdPx | string |  | New TP order price, -1=market |
| newSlTriggerPx | string |  | New SL trigger price |
| newSlOrdPx | string |  | New SL order price, -1=market |

### `spot_cancel_algo_order` · WRITE
Cancel a spot algo order (TP/SL).

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| algoId | string | ✓ |  |

### `spot_get_algo_orders` · read-only
Query spot algo orders (TP/SL) - pending or history.

| param | type | req | description |
|---|---|---|---|
| status | pending\|history |  | pending=active (default), history=completed |
| instId | string |  | Instrument ID filter |
| ordType | conditional\|oco\|move_order_stop |  | Filter by type |
| after | string |  | Cursor: older than this algo ID |
| before | string |  | Cursor: newer than this algo ID |
| limit | number |  | Max results (default 100) |
| state | effective\|canceled\|order_failed |  | Required for history. effective=triggered, canceled, order_failed. Default: effective. |

### `spot_get_fills` · read-only
Get spot transaction fills. archive=false(3d, default)|true(up to 3mo).

| param | type | req | description |
|---|---|---|---|
| archive | boolean |  | true=up to 3mo, false=3d (default) |
| instId | string |  | Instrument ID filter |
| ordId | string |  | Order ID filter |
| after | string |  | Cursor: older than this bill ID |
| before | string |  | Cursor: newer than this bill ID |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100 or 20 for archive) |

### `spot_batch_orders` · WRITE
[CAUTION] Batch place/cancel/amend up to 20 spot orders. action: place|cancel|amend.

| param | type | req | description |
|---|---|---|---|
| action | place\|cancel\|amend | ✓ |  |
| orders | array | ✓ | Array (max 20). place: {instId,side,ordType,sz,tdMode(default cash; use cross for unified/margin accounts),px?,clOrdId?,tpTriggerPx?,tpOrdPx?,slTriggerPx?,slOrdPx?}. cancel: {instId,ordId\|clOrdId}. amend: {instId,ordId\|clOrdId,newSz?,newPx?}. |

### `spot_get_order` · read-only
Get details of a single spot order.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT |
| ordId | string |  | Provide ordId or clOrdId |
| clOrdId | string |  | Provide ordId or clOrdId |

### `spot_batch_amend` · WRITE
[CAUTION] Batch amend up to 20 unfilled spot orders.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array (max 20): {instId, ordId?, clOrdId?, newSz?, newPx?} |

### `spot_batch_cancel` · WRITE
[CAUTION] Batch cancel up to 20 spot orders.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array (max 20): {instId, ordId?, clOrdId?} |

### `spot_set_leverage` · WRITE
Set leverage for SPOT margin trading. Provide exactly ONE of instId (pair-level) or ccy (currency-level cross, requires borrow-enabled account / multi-ccy / portfolio margin). [CAUTION] Changes risk parameters.
Scenarios:
  • instId + mgnMode=isolated -> pair-level isolated margin
  • instId + mgnMode=cross    -> pair-level cross margin (contract-mode account)
  • ccy    + mgnMode=cross    -> currency-level cross margin (spot-with-borrow / multi-ccy / portfolio margin)
When ccy is supplied, mgnMode MUST be cross. posSide is never applicable to spot margin.

| param | type | req | description |
|---|---|---|---|
| instId | string |  | Spot pair, e.g. BTC-USDT. Provide instId OR ccy, not both. |
| ccy | string |  | Margin currency, e.g. BTC. Required only for currency-level cross margin (borrow-enabled / multi-ccy / portfolio margin). Mutually exclusive with instId. |
| lever | string | ✓ | Leverage multiplier as a positive number string, e.g. '3'. Max depends on the pair (query market_get_instruments -> lever) or the account policy for ccy-level. |
| mgnMode | cross\|isolated | ✓ | cross or isolated. Must be cross when ccy is supplied. |

## swap (17)

### `swap_place_order` · WRITE
Place SWAP/FUTURES order. Attach TP/SL via tpTriggerPx/slTriggerPx. Before placing, use market_get_instruments to get ctVal (contract face value) - do NOT assume contract sizes. [CAUTION] Executes real trades.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| tdMode | cross\|isolated | ✓ | cross\|isolated margin |
| side | buy\|sell | ✓ | buy=long, sell=short; hedge: use with posSide |
| posSide | long\|short\|net |  | net=one-way (default); long/short=hedge mode |
| ordType | market\|limit\|post_only\|fok\|ioc | ✓ | market=no px; limit/fok/ioc=px req; post_only=maker |
| sz | string | ✓ | Number of contracts. Each contract = ctVal units (e.g. 0.1 ETH for ETH-USDT-SWAP). Query market_get_instruments for exact ctVal. Set tgtCcy=quote_ccy to specify sz in USDT notional value; set tgtCcy=margin to specify sz as margin cost (notional = sz * leverage). |
| tgtCcy | base_ccy\|quote_ccy\|margin |  | Size unit. base_ccy(default): sz in contracts; quote_ccy: sz in USDT notional value; margin: sz in USDT margin cost (actual position = sz * leverage) |
| px | string |  | Required for limit/post_only/fok/ioc |
| reduceOnly | boolean |  | Close/reduce only, no new position (one-way mode) |
| clOrdId | string |  | Client order ID (max 32 chars) |
| tpTriggerPx | string |  | TP trigger price |
| tpOrdPx | string |  | TP order price; -1=market |
| tpOrdKind | condition\|limit |  | condition(default)=trigger-based TP; limit=immediate limit order (no trigger phase) |
| tpTriggerPxType | last\|index\|mark |  | TP trigger price source: last(default)\|index\|mark |
| slTriggerPx | string |  | SL trigger price |
| slOrdPx | string |  | SL order price; -1=market |
| slTriggerPxType | last\|index\|mark |  | SL trigger price source: last(default)\|index\|mark |
| stpMode | cancel_maker\|cancel_taker\|cancel_both |  | Self-trade prevention: cancel_maker\|cancel_taker\|cancel_both |

### `swap_cancel_order` · WRITE
Cancel an unfilled SWAP/FUTURES order.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| ordId | string |  |  |
| clOrdId | string |  | Client order ID |

### `swap_get_order` · read-only
Get details of a single SWAP/FUTURES order by ordId or clOrdId.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| ordId | string |  | Provide ordId or clOrdId |
| clOrdId | string |  |  |

### `swap_get_orders` · read-only
Query SWAP/FUTURES open orders, history (last 7 days), or archive (up to 3 months).

| param | type | req | description |
|---|---|---|---|
| status | open\|history\|archive |  | open=active, history=7d, archive=3mo |
| instType | SWAP\|FUTURES |  | SWAP (default) or FUTURES |
| instId | string |  | e.g. BTC-USDT-SWAP |
| ordType | string |  | Order type filter |
| state | string |  | canceled\|filled |
| after | string |  | Cursor: return older |
| before | string |  | Cursor: return newer |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100) |

### `swap_get_positions` · read-only
Get current SWAP/FUTURES positions.

| param | type | req | description |
|---|---|---|---|
| instType | SWAP\|FUTURES |  | SWAP (default) or FUTURES |
| instId | string |  | e.g. BTC-USDT-SWAP |
| posId | string |  |  |

### `swap_get_fills` · read-only
Get SWAP/FUTURES fill details. archive=false (default): last 3 days; archive=true: up to 3 months.

| param | type | req | description |
|---|---|---|---|
| archive | boolean |  | true=up to 3 months; false=last 3 days (default) |
| instType | SWAP\|FUTURES |  | SWAP (default) or FUTURES |
| instId | string |  | Instrument ID filter |
| ordId | string |  | Order ID filter |
| after | string |  | Cursor: return older |
| before | string |  | Cursor: return newer |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100 or 20 for archive) |

### `swap_close_position` · WRITE
[CAUTION] Close entire SWAP/FUTURES position at market.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| mgnMode | cross\|isolated | ✓ |  |
| posSide | long\|short\|net |  | long/short=hedge mode; omit for one-way (net) |
| autoCxl | boolean |  | Cancel pending orders for this instrument on close |
| clOrdId | string |  | Client order ID for close order |

### `swap_set_leverage` · WRITE
Set leverage for a SWAP/FUTURES instrument or position. [CAUTION] Changes risk parameters.
Scenarios (SWAP/FUTURES only):
  • cross + any instId under the index -> sets leverage at the index level
  • isolated + buy-sell (net) posMode -> instId only
  • isolated + long-short (hedge) posMode -> instId + posSide=long|short (BOTH directions must be set separately)
Not supported: PORTFOLIO MARGIN accounts cannot adjust cross leverage for SWAP/FUTURES - the request will be rejected by OKX. Use account_get_config first if unsure of the account's margin mode.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| lever | string | ✓ | Leverage multiplier as a positive number string, e.g. '10'. Max value depends on the instrument (query market_get_instruments -> lever). |
| mgnMode | cross\|isolated | ✓ |  |
| posSide | long\|short |  | REQUIRED when mgnMode=isolated AND the account is in hedge (long/short) position mode. Use 'long' or 'short' - setting one side does NOT auto-apply to the other. Omit entirely for one-way (net) position mode or for cross margin. |

### `swap_get_leverage` · read-only
Get current leverage for a SWAP/FUTURES instrument.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| mgnMode | cross\|isolated | ✓ |  |

### `swap_batch_amend` · WRITE
[CAUTION] Batch amend up to 20 unfilled SWAP/FUTURES orders.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array (max 20): {instId, ordId?, clOrdId?, newSz?, newPx?} |

### `swap_batch_cancel` · WRITE
[CAUTION] Batch cancel up to 20 SWAP/FUTURES orders.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array (max 20): {instId, ordId?, clOrdId?} |

### `swap_amend_algo_order` · WRITE
Amend a pending SWAP/FUTURES algo order (modify TP/SL prices or size). Also covers TP/SL orders attached when placing the main order - look up algoId via swap_get_algo_orders first.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| algoId | string | ✓ | Algo order ID |
| newSz | string |  | New contracts count |
| newTpTriggerPx | string |  | New TP trigger price |
| newTpOrdPx | string |  | New TP order price; -1=market |
| newSlTriggerPx | string |  | New SL trigger price |
| newSlOrdPx | string |  | New SL order price; -1=market |

### `swap_batch_orders` · WRITE
[CAUTION] Batch place/cancel/amend SWAP/FUTURES orders (max 20). action=place|cancel|amend.

| param | type | req | description |
|---|---|---|---|
| action | place\|cancel\|amend | ✓ |  |
| orders | array | ✓ | Max 20. place:{instId,tdMode,side,ordType,sz,...}; cancel:{instId,ordId\|clOrdId}; amend:{instId,ordId\|clOrdId,newSz?,newPx?}. |

### `swap_place_algo_order` · WRITE
Place a SWAP/FUTURES algo order. [CAUTION] Executes real trades. conditional: single TP, single SL, or both on one order. oco: TP+SL simultaneously - first trigger cancels the other. move_order_stop: trailing stop (callbackRatio or callbackSpread). trigger: pending order activated when triggerPx is hit (provide triggerPx + orderPx). chase: smart-follow best bid/ask. iceberg: split large order into child orders at intervals. twap: time-weighted average price order splitting.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| tdMode | cross\|isolated | ✓ | cross\|isolated margin |
| side | buy\|sell | ✓ | sell=close long, buy=close short |
| posSide | long\|short\|net |  | net=one-way (default); long/short=hedge mode |
| ordType | conditional\|oco\|move_order_stop\|trigger\|chase\|iceberg\|twap | ✓ | conditional=single TP/SL or both; oco=TP+SL pair; move_order_stop=trailing stop; trigger=pending order; chase=follow best bid/ask; iceberg=split order; twap=time-weighted split |
| sz | string |  | Number of contracts to close (NOT USDT amount). Use market_get_instruments to get ctVal for conversion. Required unless closeFraction is provided (conditional/oco only). |
| closeFraction | 1 |  | Close 100% of position (full close). Use instead of sz for conditional/oco ordTypes only. Must be "1" (only full-position close is supported). When posSide=net, reduceOnly must also be true. |
| tpTriggerPx | string |  | TP trigger price (conditional/oco only) |
| tpOrdPx | string |  | TP order price; -1=market (conditional/oco only) |
| tpOrdKind | condition\|limit |  | condition(default)=trigger-based TP; limit=immediate limit order (no trigger phase) |
| tpTriggerPxType | last\|index\|mark |  | TP trigger price source: last(default)\|index\|mark |
| slTriggerPx | string |  | SL trigger price (conditional/oco only) |
| slOrdPx | string |  | SL order price; -1=market (recommended) (conditional/oco only) |
| slTriggerPxType | last\|index\|mark |  | SL trigger price source: last(default)\|index\|mark |
| stpMode | cancel_maker\|cancel_taker\|cancel_both |  | Self-trade prevention: cancel_maker\|cancel_taker\|cancel_both |
| cxlOnClosePos | boolean |  | Auto-cancel TP/SL when associated position closes (algo only) |
| callbackRatio | string |  | Callback ratio (e.g. '0.01'=1%); provide either ratio or spread (move_order_stop only) |
| callbackSpread | string |  | Callback spread in price units; provide either ratio or spread (move_order_stop only) |
| activePx | string |  | Activation price; tracking starts after market reaches this level (move_order_stop only) |
| triggerPx | string |  | Activation price; order submits when market hits this level (trigger only) |
| orderPx | string |  | Order price submitted when trigger fires; -1=market (trigger only) |
| advanceOrdType | fok\|ioc |  | Execution qualifier for triggered order: fok=fill-or-kill, ioc=immediate-or-cancel (trigger only) |
| triggerPxType | last\|index\|mark |  | Price type used to evaluate trigger: last(default)\|index\|mark (trigger only) |
| chaseType | distance\|ratio |  | Chase unit: distance=price ticks, ratio=proportion of price (chase only, default distance) |
| chaseVal | string |  | Chase amount matching chaseType (e.g. 0.5 ticks for distance, 0.001 for ratio) (chase only) |
| maxChaseType | distance\|ratio |  | Upper-bound unit for chase (chase only) |
| maxChaseVal | string |  | Upper-bound value for chase (chase only) |
| pxVar | string |  | Price variance % [0.0001, 0.01]; provide pxVar OR pxSpread (iceberg/twap only) |
| pxSpread | string |  | Price variance constant >= 0; provide pxVar OR pxSpread (iceberg/twap only) |
| szLimit | string |  | Average per-child-order size (iceberg/twap only) |
| pxLimit | string |  | Order price ceiling >= 0 (iceberg/twap only) |
| timeInterval | string |  | Seconds between child orders (iceberg/twap only) |
| tgtCcy | base_ccy\|quote_ccy\|margin |  | Size unit. base_ccy(default): sz in contracts; quote_ccy: sz in USDT notional value; margin: sz in USDT margin cost (actual position = sz * leverage) |
| reduceOnly | boolean |  | Ensure order only reduces position. Required when closeFraction is used with posSide=net. |
| algoClOrdId | string |  | Client-assigned algo order ID (1-32 alphanumeric chars). Legacy alias clOrdId is also accepted. |

### `swap_place_move_stop_order` · WRITE
[DEPRECATED] Use swap_place_algo_order with ordType='move_order_stop' instead. Place a SWAP/FUTURES trailing stop order. [CAUTION] Executes real trades. Specify callbackRatio (e.g. '0.01'=1%) or callbackSpread (fixed price distance), not both. Optionally set activePx so tracking starts once market reaches that price.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| tdMode | cross\|isolated | ✓ | cross\|isolated margin |
| side | buy\|sell | ✓ | sell=close long, buy=close short |
| posSide | long\|short\|net |  | net=one-way (default); long/short=hedge mode |
| sz | string | ✓ | Number of contracts (NOT USDT amount). Use market_get_instruments to get ctVal for conversion. |
| callbackRatio | string |  | Callback ratio (e.g. '0.01'=1%); provide either ratio or spread |
| callbackSpread | string |  | Callback spread in price units; provide either ratio or spread |
| activePx | string |  | Activation price; tracking starts after market reaches this level |
| reduceOnly | boolean |  | Ensure order only reduces position |
| algoClOrdId | string |  | Client-assigned algo order ID (1-32 alphanumeric chars). Legacy alias clOrdId is also accepted. |

### `swap_cancel_algo_orders` · WRITE
Cancel one or more pending SWAP/FUTURES algo orders (TP/SL). Accepts a list of {algoId, instId} objects.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | List of algo orders to cancel. Each item: {algoId, instId}. |

### `swap_get_algo_orders` · read-only
Query pending or completed SWAP/FUTURES algo orders (TP/SL, OCO, trailing stop).

| param | type | req | description |
|---|---|---|---|
| status | pending\|history |  | pending=active (default); history=completed |
| instType | SWAP\|FUTURES |  | SWAP (default) or FUTURES |
| ordType | conditional\|oco\|move_order_stop |  | Filter by type; omit for all |
| instId | string |  | Instrument ID filter |
| algoId | string |  | Filter by algo order ID |
| after | string |  | Pagination: before this algo ID |
| before | string |  | Pagination: after this algo ID |
| limit | number |  | Max results (default 100) |
| state | effective\|canceled\|order_failed |  | Required when status=history. effective=triggered, canceled, order_failed. Defaults to effective. |

## futures (18)

### `futures_place_order` · WRITE
Place FUTURES delivery order. Attach TP/SL via tpTriggerPx/slTriggerPx. Before placing, use market_get_instruments to get ctVal (contract face value) - do NOT assume contract sizes. [CAUTION] Executes real trades.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| tdMode | cross\|isolated | ✓ | cross\|isolated margin |
| side | buy\|sell | ✓ | buy=long, sell=short; hedge: use with posSide |
| posSide | long\|short\|net |  | net=one-way (default); long/short=hedge mode |
| ordType | market\|limit\|post_only\|fok\|ioc | ✓ | market=no px; limit/fok/ioc=px req; post_only=maker |
| sz | string | ✓ | Number of contracts. Each contract = ctVal units (e.g. 0.1 ETH for ETH-USDT-SWAP). Query market_get_instruments for exact ctVal. Set tgtCcy=quote_ccy to specify sz in USDT notional value; set tgtCcy=margin to specify sz as margin cost (notional = sz * leverage). |
| tgtCcy | base_ccy\|quote_ccy\|margin |  | Size unit. base_ccy(default): sz in contracts; quote_ccy: sz in USDT notional value; margin: sz in USDT margin cost (actual position = sz * leverage) |
| px | string |  | Required for limit/post_only/fok/ioc |
| reduceOnly | boolean |  | Close/reduce only, no new position (one-way mode) |
| clOrdId | string |  | Client order ID (max 32 chars) |
| tpTriggerPx | string |  | TP trigger price |
| tpOrdPx | string |  | TP order price; -1=market |
| tpOrdKind | condition\|limit |  | condition(default)=trigger-based TP; limit=immediate limit order (no trigger phase) |
| tpTriggerPxType | last\|index\|mark |  | TP trigger price source: last(default)\|index\|mark |
| slTriggerPx | string |  | SL trigger price |
| slOrdPx | string |  | SL order price; -1=market |
| slTriggerPxType | last\|index\|mark |  | SL trigger price source: last(default)\|index\|mark |
| stpMode | cancel_maker\|cancel_taker\|cancel_both |  | Self-trade prevention: cancel_maker\|cancel_taker\|cancel_both |

### `futures_cancel_order` · WRITE
Cancel an unfilled FUTURES delivery order.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| ordId | string |  |  |
| clOrdId | string |  | Client order ID |

### `futures_get_order` · read-only
Get details of a single FUTURES delivery order by ordId or clOrdId.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| ordId | string |  | Provide ordId or clOrdId |
| clOrdId | string |  |  |

### `futures_get_orders` · read-only
Query FUTURES delivery open orders, history (last 7 days), or archive (up to 3 months).

| param | type | req | description |
|---|---|---|---|
| status | open\|history\|archive |  | open=active, history=7d, archive=3mo |
| instType | FUTURES\|SWAP |  | FUTURES (default) or SWAP |
| instId | string |  | e.g. BTC-USDT-240329 |
| ordType | string |  | Order type filter |
| state | string |  | canceled\|filled |
| after | string |  | Cursor: return older |
| before | string |  | Cursor: return newer |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100) |

### `futures_get_positions` · read-only
Get current FUTURES delivery positions.

| param | type | req | description |
|---|---|---|---|
| instType | FUTURES\|SWAP |  | FUTURES (default) or SWAP |
| instId | string |  | e.g. BTC-USDT-240329 |
| posId | string |  |  |

### `futures_get_fills` · read-only
Get FUTURES delivery fill details. archive=false (default): last 3 days; archive=true: up to 3 months.

| param | type | req | description |
|---|---|---|---|
| archive | boolean |  | true=up to 3 months; false=last 3 days (default) |
| instType | FUTURES\|SWAP |  | FUTURES (default) or SWAP |
| instId | string |  | Instrument ID filter |
| ordId | string |  | Order ID filter |
| after | string |  | Cursor: return older |
| before | string |  | Cursor: return newer |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100 or 20 for archive) |

### `futures_close_position` · WRITE
[CAUTION] Close entire FUTURES delivery position at market.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| mgnMode | cross\|isolated | ✓ |  |
| posSide | long\|short\|net |  | long/short=hedge mode; omit for one-way (net) |
| autoCxl | boolean |  | Cancel pending orders for this instrument on close |
| clOrdId | string |  | Client order ID for close order |

### `futures_set_leverage` · WRITE
Set leverage for a FUTURES delivery instrument or position. [CAUTION] Changes risk parameters.
Scenarios (SWAP/FUTURES only):
  • cross + any instId under the index -> sets leverage at the index level
  • isolated + buy-sell (net) posMode -> instId only
  • isolated + long-short (hedge) posMode -> instId + posSide=long|short (BOTH directions must be set separately)
Not supported: PORTFOLIO MARGIN accounts cannot adjust cross leverage for SWAP/FUTURES - the request will be rejected by OKX. Use account_get_config first if unsure of the account's margin mode.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| lever | string | ✓ | Leverage multiplier as a positive number string, e.g. '10'. Max value depends on the instrument (query market_get_instruments -> lever). |
| mgnMode | cross\|isolated | ✓ |  |
| posSide | long\|short |  | REQUIRED when mgnMode=isolated AND the account is in hedge (long/short) position mode. Use 'long' or 'short' - setting one side does NOT auto-apply to the other. Omit entirely for one-way (net) position mode or for cross margin. |

### `futures_get_leverage` · read-only
Get current leverage for a FUTURES delivery instrument.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| mgnMode | cross\|isolated | ✓ |  |

### `futures_batch_amend` · WRITE
[CAUTION] Batch amend up to 20 unfilled FUTURES delivery orders.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array (max 20): {instId, ordId?, clOrdId?, newSz?, newPx?} |

### `futures_batch_cancel` · WRITE
[CAUTION] Batch cancel up to 20 FUTURES delivery orders.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array (max 20): {instId, ordId?, clOrdId?} |

### `futures_amend_order` · WRITE
Amend an unfilled FUTURES delivery order (modify price and/or size). To modify attached TP/SL, use futures_amend_algo_order with the algoId from futures_get_algo_orders.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| ordId | string |  | Provide ordId or clOrdId |
| clOrdId | string |  |  |
| newSz | string |  | New number of contracts |
| newPx | string |  | New price |

### `futures_batch_orders` · WRITE
[CAUTION] Batch place up to 20 FUTURES delivery orders.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array (max 20): {instId,tdMode,side,ordType,sz,px?,posSide?,reduceOnly?,clOrdId?,tpTriggerPx?,tpOrdPx?,slTriggerPx?,slOrdPx?} |

### `futures_place_algo_order` · WRITE
Place a FUTURES delivery algo order. [CAUTION] Executes real trades. conditional: single TP, single SL, or both on one order. oco: TP+SL simultaneously - first trigger cancels the other. move_order_stop: trailing stop (callbackRatio or callbackSpread). trigger: pending order activated when triggerPx is hit (provide triggerPx + orderPx). chase: smart-follow best bid/ask. iceberg: split large order into child orders at intervals. twap: time-weighted average price order splitting.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| tdMode | cross\|isolated | ✓ | cross\|isolated margin |
| side | buy\|sell | ✓ | sell=close long, buy=close short |
| posSide | long\|short\|net |  | net=one-way (default); long/short=hedge mode |
| ordType | conditional\|oco\|move_order_stop\|trigger\|chase\|iceberg\|twap | ✓ | conditional=single TP/SL or both; oco=TP+SL pair; move_order_stop=trailing stop; trigger=pending order; chase=follow best bid/ask; iceberg=split order; twap=time-weighted split |
| sz | string |  | Number of contracts (NOT USDT amount). Required unless closeFraction is provided (conditional/oco only). |
| closeFraction | 1 |  | Close 100% of position (full close). Use instead of sz for conditional/oco ordTypes only. Must be "1" (only full-position close is supported). When posSide=net, reduceOnly must also be true. |
| tpTriggerPx | string |  | TP trigger price (conditional/oco only) |
| tpOrdPx | string |  | TP order price; -1=market (conditional/oco only) |
| tpOrdKind | condition\|limit |  | condition(default)=trigger-based TP; limit=immediate limit order (no trigger phase) |
| tpTriggerPxType | last\|index\|mark |  | TP trigger price source: last(default)\|index\|mark |
| slTriggerPx | string |  | SL trigger price (conditional/oco only) |
| slOrdPx | string |  | SL order price; -1=market (conditional/oco only) |
| slTriggerPxType | last\|index\|mark |  | SL trigger price source: last(default)\|index\|mark |
| stpMode | cancel_maker\|cancel_taker\|cancel_both |  | Self-trade prevention: cancel_maker\|cancel_taker\|cancel_both |
| cxlOnClosePos | boolean |  | Auto-cancel TP/SL when associated position closes (algo only) |
| callbackRatio | string |  | Callback ratio (e.g. '0.01'=1%); provide either ratio or spread (move_order_stop only) |
| callbackSpread | string |  | Callback spread in price units (move_order_stop only) |
| activePx | string |  | Activation price; tracking starts after market reaches this level (move_order_stop only) |
| triggerPx | string |  | Activation price; order submits when market hits this level (trigger only) |
| orderPx | string |  | Order price submitted when trigger fires; -1=market (trigger only) |
| advanceOrdType | fok\|ioc |  | Execution qualifier for triggered order: fok=fill-or-kill, ioc=immediate-or-cancel (trigger only) |
| triggerPxType | last\|index\|mark |  | Price type used to evaluate trigger: last(default)\|index\|mark (trigger only) |
| chaseType | distance\|ratio |  | Chase unit: distance=price ticks, ratio=proportion of price (chase only, default distance) |
| chaseVal | string |  | Chase amount matching chaseType (e.g. 0.5 ticks for distance, 0.001 for ratio) (chase only) |
| maxChaseType | distance\|ratio |  | Upper-bound unit for chase (chase only) |
| maxChaseVal | string |  | Upper-bound value for chase (chase only) |
| pxVar | string |  | Price variance % [0.0001, 0.01]; provide pxVar OR pxSpread (iceberg/twap only) |
| pxSpread | string |  | Price variance constant >= 0; provide pxVar OR pxSpread (iceberg/twap only) |
| szLimit | string |  | Average per-child-order size (iceberg/twap only) |
| pxLimit | string |  | Order price ceiling >= 0 (iceberg/twap only) |
| timeInterval | string |  | Seconds between child orders (iceberg/twap only) |
| tgtCcy | base_ccy\|quote_ccy\|margin |  | Size unit. base_ccy(default): sz in contracts; quote_ccy: sz in USDT notional value; margin: sz in USDT margin cost (actual position = sz * leverage) |
| reduceOnly | boolean |  | Ensure order only reduces position. Required when closeFraction is used with posSide=net. |
| algoClOrdId | string |  | Client-assigned algo order ID (1-32 alphanumeric chars). Legacy alias clOrdId is also accepted. |

### `futures_place_move_stop_order` · WRITE
[DEPRECATED] Use futures_place_algo_order with ordType='move_order_stop' instead. Place a FUTURES delivery trailing stop order. [CAUTION] Executes real trades.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| tdMode | cross\|isolated | ✓ | cross\|isolated margin |
| side | buy\|sell | ✓ | sell=close long, buy=close short |
| posSide | long\|short\|net |  | net=one-way (default); long/short=hedge mode |
| sz | string | ✓ | Number of contracts (NOT USDT amount). |
| callbackRatio | string |  | Callback ratio (e.g. '0.01'=1%); provide either ratio or spread |
| callbackSpread | string |  | Callback spread in price units; provide either ratio or spread |
| activePx | string |  | Activation price |
| reduceOnly | boolean |  | Ensure order only reduces position |
| algoClOrdId | string |  | Client-assigned algo order ID (1-32 alphanumeric chars). Legacy alias clOrdId is also accepted. |

### `futures_amend_algo_order` · WRITE
Amend a pending FUTURES delivery algo order (modify TP/SL prices or size). Also covers TP/SL orders attached when placing the main order - look up algoId via futures_get_algo_orders first.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-240329 |
| algoId | string | ✓ | Algo order ID |
| newSz | string |  | New number of contracts |
| newTpTriggerPx | string |  | New TP trigger price |
| newTpOrdPx | string |  | New TP order price; -1=market |
| newSlTriggerPx | string |  | New SL trigger price |
| newSlOrdPx | string |  | New SL order price; -1=market |

### `futures_cancel_algo_orders` · WRITE
Cancel one or more pending FUTURES delivery algo orders (TP/SL). Accepts a list of {algoId, instId} objects.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | List of algo orders to cancel. Each item: {algoId, instId}. |

### `futures_get_algo_orders` · read-only
Query pending or completed FUTURES delivery algo orders (TP/SL, OCO, trailing stop).

| param | type | req | description |
|---|---|---|---|
| status | pending\|history |  | pending=active (default); history=completed |
| ordType | conditional\|oco\|move_order_stop |  | Filter by type; omit for all |
| instId | string |  | Instrument ID filter |
| algoId | string |  | Filter by algo order ID |
| after | string |  | Pagination: before this algo ID |
| before | string |  | Pagination: after this algo ID |
| limit | number |  | Max results (default 100) |
| state | effective\|canceled\|order_failed |  | Required when status=history. effective=triggered, canceled, order_failed. Defaults to effective. |

## option (14)

### `option_place_order` · WRITE
Place OPTION order. instId: {uly}-{expiry}-{strike}-C/P, e.g. BTC-USD-241227-50000-C. Before placing, use market_get_instruments to get ctVal (contract face value) - do NOT assume contract sizes. [CAUTION] Executes real trades.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USD-241227-50000-C |
| tdMode | cash\|cross\|isolated | ✓ | cash=buyer full premium; cross/isolated=seller margin |
| side | buy\|sell | ✓ |  |
| ordType | market\|limit\|post_only\|fok\|ioc | ✓ | market=no px; limit/fok/ioc=px req; post_only=maker |
| sz | string | ✓ | Contracts count by default. Set tgtCcy=quote_ccy to specify USDT notional value; set tgtCcy=margin to specify USDT margin cost (notional = sz * leverage). |
| tgtCcy | base_ccy\|quote_ccy\|margin |  | Size unit. base_ccy(default): sz in contracts; quote_ccy: sz in USDT notional value; margin: sz in USDT margin cost (actual position = sz * leverage) |
| px | string |  | Required for limit/post_only/fok/ioc |
| reduceOnly | boolean |  | Reduce/close only |
| clOrdId | string |  | Client order ID (max 32 chars) |
| tpTriggerPx | string |  | TP trigger price |
| tpOrdPx | string |  | TP order price; -1=market |
| tpOrdKind | condition\|limit |  | condition(default)=trigger-based TP; limit=immediate limit order (no trigger phase) |
| tpTriggerPxType | last\|index\|mark |  | TP trigger price source: last(default)\|index\|mark |
| slTriggerPx | string |  | SL trigger price |
| slOrdPx | string |  | SL order price; -1=market |
| slTriggerPxType | last\|index\|mark |  | SL trigger price source: last(default)\|index\|mark |
| stpMode | cancel_maker\|cancel_taker\|cancel_both |  | Self-trade prevention: cancel_maker\|cancel_taker\|cancel_both |

### `option_cancel_order` · WRITE
Cancel an unfilled OPTION order. Provide ordId or clOrdId.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USD-241227-50000-C |
| ordId | string |  |  |
| clOrdId | string |  |  |

### `option_batch_cancel` · WRITE
[CAUTION] Batch cancel up to 20 OPTION orders.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array (max 20): {instId, ordId?, clOrdId?} |

### `option_amend_order` · WRITE
Amend an unfilled OPTION order (price and/or size). Provide ordId or clOrdId. To modify attached TP/SL, use option_amend_algo_order with the algoId from option_get_algo_orders.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USD-241227-50000-C |
| ordId | string |  |  |
| clOrdId | string |  |  |
| newSz | string |  | New contracts count |
| newPx | string |  | New price |

### `option_get_order` · read-only
Get details of a single OPTION order by ordId or clOrdId.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USD-241227-50000-C |
| ordId | string |  | Provide ordId or clOrdId |
| clOrdId | string |  |  |

### `option_get_orders` · read-only
List OPTION orders. status: live=pending (default), history=7d, archive=3mo.

| param | type | req | description |
|---|---|---|---|
| status | live\|history\|archive |  | live=pending (default), history=7d, archive=3mo |
| uly | string |  | Underlying filter, e.g. BTC-USD |
| instId | string |  | Instrument filter |
| ordType | string |  | Order type filter |
| state | string |  | canceled\|filled |
| after | string |  | Cursor: return older |
| before | string |  | Cursor: return newer |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100) |

### `option_get_positions` · read-only
Get current OPTION positions including Greeks (delta, gamma, theta, vega).

| param | type | req | description |
|---|---|---|---|
| instId | string |  | Filter by specific contract |
| uly | string |  | Filter by underlying, e.g. BTC-USD |

### `option_get_fills` · read-only
Get OPTION fill history. archive=false: last 3 days (default); archive=true: up to 3 months.

| param | type | req | description |
|---|---|---|---|
| archive | boolean |  | true=up to 3 months; false=last 3 days (default) |
| instId | string |  | Instrument filter |
| ordId | string |  | Order ID filter |
| after | string |  | Cursor: return older |
| before | string |  | Cursor: return newer |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results |

### `option_get_instruments` · read-only
List available OPTION contracts for a given underlying (option chain). Use to find valid instIds before placing orders.

| param | type | req | description |
|---|---|---|---|
| uly | string | ✓ | Underlying, e.g. BTC-USD or ETH-USD |
| expTime | string |  | Filter by expiry date, e.g. 241227 |

### `option_get_greeks` · read-only
Get implied volatility and Greeks (delta, gamma, theta, vega) for OPTION contracts by underlying.

| param | type | req | description |
|---|---|---|---|
| uly | string | ✓ | Underlying, e.g. BTC-USD or ETH-USD |
| expTime | string |  | Filter by expiry date, e.g. 241227 |

### `option_place_algo_order` · WRITE
Place OPTION TP/SL algo order (conditional/oco). [CAUTION] Executes real trades. conditional=single TP/SL; oco=TP+SL pair. -1=market.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USD-241227-50000-C |
| tdMode | cash\|cross\|isolated | ✓ | cash=buyer full premium; cross/isolated=seller margin |
| side | buy\|sell | ✓ | sell=close long, buy=close short |
| ordType | conditional\|oco | ✓ | conditional=single TP/SL or both; oco=TP+SL pair (first trigger cancels other) |
| sz | string | ✓ | Contracts count (NOT USDT). Use market_get_instruments for ctVal. |
| tpTriggerPx | string |  | TP trigger price |
| tpOrdPx | string |  | TP order price; -1=market |
| tpTriggerPxType | last\|index\|mark |  |  |
| slTriggerPx | string |  | SL trigger price |
| slOrdPx | string |  | SL order price; -1=market |
| slTriggerPxType | last\|index\|mark |  |  |
| tgtCcy | base_ccy\|quote_ccy\|margin |  | Size unit. base_ccy(default): sz in contracts; quote_ccy: sz in USDT notional value; margin: sz in USDT margin cost (actual position = sz * leverage) |
| reduceOnly | boolean |  | Ensure order only reduces position |
| algoClOrdId | string |  | Client-assigned algo order ID (1-32 alphanumeric chars). Legacy alias clOrdId is also accepted. |

### `option_amend_algo_order` · WRITE
Amend a pending OPTION algo order (modify TP/SL prices or size). Also covers TP/SL orders attached when placing the main order - look up algoId via option_get_algo_orders first.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USD-241227-50000-C |
| algoId | string | ✓ | Algo order ID |
| newSz | string |  | New contracts count |
| newTpTriggerPx | string |  | New TP trigger price |
| newTpOrdPx | string |  | New TP order price; -1=market |
| newSlTriggerPx | string |  | New SL trigger price |
| newSlOrdPx | string |  | New SL order price; -1=market |

### `option_cancel_algo_orders` · WRITE
Cancel OPTION algo orders (TP/SL). Each item: {algoId, instId}.

| param | type | req | description |
|---|---|---|---|
| orders | array | ✓ | Array of {algoId, instId} to cancel. |

### `option_get_algo_orders` · read-only
Query pending or completed OPTION algo orders (TP/SL, OCO).

| param | type | req | description |
|---|---|---|---|
| status | pending\|history |  | pending=active (default); history=completed |
| ordType | conditional\|oco |  | Filter by type; omit for all |
| instId | string |  | Instrument ID filter |
| algoId | string |  | Filter by algo order ID |
| after | string |  | Cursor: return older |
| before | string |  | Cursor: return newer |
| limit | number |  | Max results (default 100) |
| state | effective\|canceled\|order_failed |  | When history: effective\|canceled\|order_failed |

## account (14)

### `account_get_balance` · read-only
Get account balance for trading account. Returns balances for all currencies or a specific one.

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | e.g. BTC or BTC,ETH. Omit for all. |

### `account_transfer` · WRITE
Transfer funds between accounts (trading, funding, etc.). [CAUTION] Moves real funds.

| param | type | req | description |
|---|---|---|---|
| ccy | string | ✓ | e.g. USDT |
| amt | string | ✓ | Transfer amount |
| from | string | ✓ | Source account: 6=funding, 18=trading (unified) |
| to | string | ✓ | Destination account: 6=funding, 18=trading (unified) |
| type | string |  | 0=main account (default), 1=main->sub, 2=sub->main, 3=sub->sub |
| subAcct | string |  | Sub-account name. Required when type=1/2/3 |
| clientId | string |  | Client ID (max 32 chars) |

### `account_get_max_size` · read-only
Get max buy/sell order size for a SWAP/FUTURES instrument given current balance and leverage. Useful before placing orders.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP |
| tdMode | cross\|isolated | ✓ |  |
| px | string |  | Limit order price (omit for market) |
| leverage | string |  | Leverage (defaults to account setting) |
| ccy | string |  | Margin currency. Required for isolated mode. |

### `account_get_asset_balance` · read-only
Get funding account balance (asset account). Different from account_get_balance which queries the trading account. Optionally includes total asset valuation across all account types (trading, funding, earn, etc.).

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | e.g. BTC or BTC,ETH. Omit for all. |
| showValuation | boolean |  | Include total asset valuation breakdown by account type (trading/funding/earn). Default false. |
| valuationCcy | string |  | Currency used to denominate the total asset valuation (e.g. USDT, BTC). Default USDT. Only applies when showValuation=true. |

### `account_get_bills` · read-only
Get account ledger: fees paid, funding charges, realized PnL, transfers, etc. Default 20 records (last 7 days), max 100.

| param | type | req | description |
|---|---|---|---|
| instType | SPOT\|MARGIN\|SWAP\|FUTURES\|OPTION\|EVENTS |  |  |
| ccy | string |  | e.g. USDT |
| mgnMode | isolated\|cross |  |  |
| type | string |  | 1=transfer,2=trade,3=delivery,4=auto convert,5=liquidation,6=margin transfer,7=interest,8=funding fee,9=adl,10=clawback,11=sys convert,12=strategy transfer,13=ddh |
| after | string |  | Pagination: before this bill ID |
| before | string |  | Pagination: after this bill ID |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 20) |

### `account_get_positions_history` · read-only
Get closed position history for SWAP or FUTURES. Default 20 records, max 100.

| param | type | req | description |
|---|---|---|---|
| instType | SWAP\|FUTURES\|MARGIN\|OPTION\|EVENTS |  | Default SWAP |
| instId | string |  | e.g. BTC-USDT-SWAP |
| mgnMode | cross\|isolated |  |  |
| type | string |  | 1=close long,2=close short,3=liq long,4=liq short,5=ADL long,6=ADL short |
| posId | string |  |  |
| after | string |  | Pagination: before this timestamp (ms) |
| before | string |  | Pagination: after this timestamp (ms) |
| limit | number |  | Max results (default 20) |

### `account_get_trade_fee` · read-only
Get maker/taker fee rates for the account. Useful to understand your fee tier before trading.

| param | type | req | description |
|---|---|---|---|
| instType | SPOT\|MARGIN\|SWAP\|FUTURES\|OPTION\|EVENTS | ✓ |  |
| instId | string |  | e.g. BTC-USDT-SWAP |

### `account_get_config` · read-only
Get account configuration: position mode (net vs hedge), account level, auto-loan settings, etc. Note: `settleCcy` is the current settlement currency for USDS-margined contracts. `settleCcyList` is the list of available settlement currencies to choose from. These fields only apply to USDS-margined contracts and can be ignored for standard USDT/coin-margined trading.

### `account_get_max_withdrawal` · read-only
Get maximum withdrawable amount for a currency from the trading account. Useful before initiating a transfer or withdrawal.

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | e.g. USDT or BTC,ETH. Omit for all. |

### `account_get_max_avail_size` · read-only
Get maximum available size for opening or reducing a position. Different from account_get_max_size which calculates new order size.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT-SWAP or BTC-USDT |
| tdMode | cross\|isolated\|cash | ✓ | cash=spot |
| ccy | string |  | Margin currency. Required for isolated MARGIN mode. |
| reduceOnly | boolean |  | true=calculate max size for closing position |

### `account_get_positions` · read-only
Get current open positions across all instrument types (MARGIN, SWAP, FUTURES, OPTION, EVENTS). Use swap_get_positions for SWAP/FUTURES-only queries.

| param | type | req | description |
|---|---|---|---|
| instType | MARGIN\|SWAP\|FUTURES\|OPTION\|EVENTS |  |  |
| instId | string |  | e.g. BTC-USDT-SWAP |
| posId | string |  |  |

### `account_get_bills_archive` · read-only
Get archived account ledger (bills older than 7 days, up to 3 months). Use account_get_bills for recent 7-day records. Default 20 records, max 100.

| param | type | req | description |
|---|---|---|---|
| instType | SPOT\|MARGIN\|SWAP\|FUTURES\|OPTION |  |  |
| ccy | string |  | e.g. USDT |
| mgnMode | isolated\|cross |  |  |
| type | string |  | 1=transfer,2=trade,3=delivery,4=auto convert,5=liquidation,6=margin transfer,7=interest,8=funding fee,9=adl,10=clawback,11=sys convert,12=strategy transfer,13=ddh |
| after | string |  | Pagination: before this bill ID |
| before | string |  | Pagination: after this bill ID |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 20) |

### `account_set_position_mode` · WRITE
Switch between net position mode and long/short hedge mode. net: one position per instrument (default). long_short_mode: separate long and short positions. [CAUTION] Requires no open positions or pending orders.

| param | type | req | description |
|---|---|---|---|
| posMode | long_short_mode\|net_mode | ✓ | long_short_mode=hedge; net_mode=one-way |

### `account_get_balance_all` · read-only
One-shot snapshot of all OKX assets: trading-account equity + funding-account balances + optional cross-account valuation. Use when the user asks for total assets / net worth / 总资产 / all balances. Prefer this over calling account_get_balance + account_get_asset_balance separately. Returns {trading, funding, valuation, meta} with per-section error so partial failures don't block the rest.

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | Filter by currency, comma-separated (e.g. BTC,ETH). Omit for all. Applied to trading + funding queries only. |
| accounts | string |  | Comma-separated accounts to query: 'trading','funding'. Default 'trading,funding'. |
| showValuation | boolean |  | Include cross-account asset valuation. Default true. |
| valuationCcy | string |  | Currency for valuation (e.g. USDT, BTC). Default USDT. Only effective when showValuation=true. |
| preferParallel | boolean |  | Skip the server-side aggregate endpoint and query trading/funding/valuation directly in parallel. Default false. Use when you need the per-account valuation breakdown or a non-USD valuation currency. |

## event (9)

### `event_browse` · read-only
Browse currently active (in-progress) event contracts. Call when user asks what event contracts are available to trade. Returns only in-progress contracts (floorStrike set). If a live quote field px is present, it is the event contract price (0.01-0.99), not the underlying asset price; it reflects the market-implied probability when actively trading. Grouped by settlement type and underlying. Do NOT use for querying contracts within a specific series - use event_get_markets with seriesId instead. Scope: OKX CEX event contracts only - a distinct product from other prediction markets. Tradable scope is exactly what this call returns; if the user's target is absent, say so rather than offering a substitute.

| param | type | req | description |
|---|---|---|---|
| underlying | string |  | Filter by underlying asset, e.g. BTC-USD, ETH-USD. Omit for all. |

### `event_get_series` · read-only
List event contract series. Returns all available series with settlement type and underlying. Use event_browse to see currently active contracts.

| param | type | req | description |
|---|---|---|---|
| seriesId | string |  | Filter by series ID, e.g. BTC-ABOVE-DAILY. Omit for all. |

### `event_get_events` · read-only
List expiry periods within a series. state: preopen|live|settling|expired. expTime is pre-formatted UTC+8.

| param | type | req | description |
|---|---|---|---|
| seriesId | string | ✓ | Series ID, e.g. BTC-ABOVE-DAILY (required) |
| eventId | string |  | Filter by event ID, e.g. BTC-ABOVE-DAILY-260224-1600 |
| state | preopen\|live\|settling\|expired |  | preopen=markets not yet trading; live=active; settling=awaiting settlement; expired=done |
| limit | number |  | Max results (default 100, max 100) |
| before | string |  | Pagination: return records newer than this expTime |
| after | string |  | Pagination: return records older than this expTime |

### `event_get_markets` · read-only
List tradeable contracts within a series. state=live for active contracts, state=expired for settlement results. floorStrike=strike price; px (when present) is the event contract price (0.01-0.99), not the underlying asset price - reflects the market-implied probability when actively trading; outcome pre-translated (pending/YES/NO/UP/DOWN); timestamps UTC+8. Do NOT use for discovering what series are available across all underlyings - use event_browse instead.

| param | type | req | description |
|---|---|---|---|
| seriesId | string | ✓ | Series ID, e.g. BTC-ABOVE-DAILY (required) |
| eventId | string |  | Filter by event ID, e.g. BTC-ABOVE-DAILY-260224-1600 |
| instId | string |  | Filter by instrument ID |
| state | preopen\|live\|settling\|expired |  | preopen=not yet trading; live=active; settling=awaiting settlement; expired=settled |
| limit | number |  | Max results (default 100, max 100) |
| before | string |  | Pagination: return records newer than this expTime |
| after | string |  | Pagination: return records older than this expTime |

### `event_get_orders` · read-only
Query event contract orders (open, 7d history, or 3-month archive). outcome pre-translated (YES/NO/UP/DOWN). Do NOT use for trade executions - use event_get_fills for fill records and settlement outcomes.

| param | type | req | description |
|---|---|---|---|
| status | open\|history\|archive |  | open=active, history=7d (default), archive=3mo |
| instId | string |  | Event contract instrument ID |
| ordType | string |  | Order type filter |
| state | string |  | canceled\|filled (only for history/archive) |
| after | string |  | Cursor: return older records |
| before | string |  | Cursor: return newer records |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100) |

### `event_get_fills` · read-only
Get event contract fill history (trade executions and settlement payouts). archive=true for up to 3mo, false (default) for last 3d. outcome pre-translated (YES/NO/UP/DOWN). Each record includes a 'type' field: 'fill' (opening trade) or 'settlement' (expiry payout with settlementResult win/loss and pnl). Do NOT use for order status - use event_get_orders instead.

| param | type | req | description |
|---|---|---|---|
| archive | boolean |  | true=up to 3mo, false=3d (default) |
| instId | string |  | Event contract instrument ID |
| ordId | string |  | Order ID filter |
| after | string |  | Cursor: return older records |
| before | string |  | Cursor: return newer records |
| begin | string |  | Start time (ms) |
| end | string |  | End time (ms) |
| limit | number |  | Max results (default 100 or 20 for archive) |

### `event_place_order` · WRITE
Place an event contract order. [CAUTION] Places a real order. Before placing, call event_get_markets(seriesId, state=live) to obtain the instId of the target contract.
- outcome: UP/YES (bet price goes up/condition met) or DOWN/NO (bet price goes down/condition not met)
- For limit orders: px is the event contract price (0.01-0.99), NOT the underlying asset price. It reflects market-implied probability when actively trading
- tdMode is always isolated; speedBump is auto-set per exchange requirement - do not pass either

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | Event contract instrument ID, e.g. BTC-ABOVE-DAILY-260224-1600-120000 |
| side | buy\|sell | ✓ | buy=open position, sell=close position |
| outcome | UP\|YES\|DOWN\|NO | ✓ | Which outcome to trade. UP/DOWN direction contracts: UP (price rises during the period) or DOWN (price falls). YES/NO price-target or touch contracts: YES (condition met) or NO (condition not met). Check the series type from event_get_series to determine which applies. NOTE: px is the event contract price (0.01-0.99), NOT the underlying asset price. It reflects market-implied probability when actively trading. |
| ordType | market\|limit\|post_only |  | Order type (default market) |
| sz | string | ✓ | For limit/post_only: number of contracts. For market: quote currency amount (server converts to contracts using best available price; actual fill count may differ). |
| px | string |  | Event contract price (0.01-0.99). Required when ordType=limit. Do NOT use for market orders. |

### `event_amend_order` · WRITE
Amend a pending event contract order (change price or size). [CAUTION] Modifies a real order. Before amending, call event_get_orders(status=open) to obtain the ordId and confirm the order is still pending. Only limit/post_only orders can be amended.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | Event contract instrument ID |
| ordId | string | ✓ | Order ID to amend |
| newPx | string |  | New event contract price (0.01-0.99). Omit to keep current. |
| newSz | string |  | New size in contracts (omit to keep current) |

### `event_cancel_order` · WRITE
Cancel a pending event contract order. [CAUTION] Cancels a real order. Before cancelling, call event_get_orders(status=open) to obtain the ordId and confirm the order is still pending. instId must be the full event contract instrument ID (e.g. BTC-ABOVE-DAILY-260224-1600-69700), NOT a spot trading pair.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | Event contract instrument ID |
| ordId | string | ✓ | Order ID to cancel |

## news (9)

### `news_get_latest` · read-only
Get crypto news sorted by time. For broad browsing ('what happened recently', 'latest news', 'any big news today'), pass importance='low' to include both high and low importance. Server default (when importance omitted) returns only high-importance news. For coin-specific news, use news_get_by_coin instead.

| param | type | req | description |
|---|---|---|---|
| coins | string |  | Comma-separated uppercase ticker symbols (e.g. "BTC,ETH"). Normalize names/aliases to standard tickers. Optional. |
| importance | high\|low |  | Importance filter: 'low' returns all news (both low and high importance); 'high' narrows to major/breaking news only. Omitted -> server default (high-only). Default to 'low' for broad browsing; pass 'high' only when the user explicitly asks for major news. |
| platform | string |  | Filter by news source. Use values from news_get_domains (e.g. blockbeats, odaily_flash). Omit for all sources. |
| begin | number |  | Start time, Unix epoch milliseconds. API defaults to 72 hours ago when omitted. Pass explicitly for older topics (e.g. 'last 30 days'). Max range: 180 days. Parse relative time if given. |
| end | number |  | End time, Unix epoch milliseconds. Parse relative time if given. Omit for no upper bound. |
| language | en-US\|zh-CN |  | Content language: zh-CN or en-US. Infer from user's message. No server default. |
| detailLvl | brief\|summary\|full |  | Content level: summary (AI summary, default), full (original text), brief (title only). |
| limit | number |  | Number of results (default 10, max 50). |
| after | string |  | Pagination cursor from previous response nextCursor. |

### `news_get_by_coin` · read-only
Get news for specific coins or tokens. Use when user mentions a coin: 'BTC news', 'any SOL updates'. Supports multiple coins (comma-separated). For general browsing without a coin filter, use news_get_latest.

| param | type | req | description |
|---|---|---|---|
| coins | string | ✓ | Comma-separated uppercase ticker symbols (e.g. "BTC,ETH"). Normalize names/aliases to standard tickers. Required. |
| importance | high\|low |  | Importance filter: 'low' returns all news (both low and high importance); 'high' narrows to major/breaking news only. Omitted -> server default (high-only). Default to 'low' for broad browsing; pass 'high' only when the user explicitly asks for major news. |
| platform | string |  | Filter by news source. Use values from news_get_domains (e.g. blockbeats, odaily_flash). Omit for all sources. |
| begin | number |  | Start time, Unix epoch milliseconds. API defaults to 72 hours ago when omitted. Pass explicitly for older topics (e.g. 'last 30 days'). Max range: 180 days. Parse relative time if given. |
| end | number |  | End time, Unix epoch milliseconds. Parse relative time if given. Omit for no upper bound. |
| language | en-US\|zh-CN |  | Content language: zh-CN or en-US. Infer from user's message. No server default. |
| detailLvl | brief\|summary\|full |  |  |
| limit | number |  | Number of results (default 10, max 50). |

### `news_search` · read-only
Search crypto news by keyword with optional filters. Use when user provides specific search terms: 'SEC ETF news', 'stablecoin regulation'. Keyword is optional - pass sentiment alone to browse by sentiment direction. For coin-only queries prefer news_get_by_coin.

| param | type | req | description |
|---|---|---|---|
| keyword | string |  | Search keyword(s) extracted from user query (topic/entity). Multiple words are AND-combined. Omit to browse by filters only. |
| coins | string |  | Comma-separated uppercase ticker symbols (e.g. "BTC,ETH"). Normalize names/aliases to standard tickers. Optional. |
| importance | high\|low |  | Importance filter: 'low' returns all news (both low and high importance); 'high' narrows to major/breaking news only. Omitted -> server default (high-only). Default to 'low' for broad browsing; pass 'high' only when the user explicitly asks for major news. |
| platform | string |  | Filter by news source. Use values from news_get_domains (e.g. blockbeats, odaily_flash). Omit for all sources. |
| sentiment | bullish\|bearish\|neutral |  | Filter by sentiment if mentioned alongside the keyword. |
| sortBy | latest\|relevant |  | Sort order: relevant (by relevance, default for keyword search), latest (by time). |
| begin | number |  | Start time, Unix epoch milliseconds. API defaults to 72 hours ago when omitted. Pass explicitly for older topics (e.g. 'last 30 days'). Max range: 180 days. Parse relative time if given. |
| end | number |  | End time, Unix epoch milliseconds. Parse relative time if given. Omit for no upper bound. |
| language | en-US\|zh-CN |  | Content language: zh-CN or en-US. Infer from user's message. No server default. |
| detailLvl | brief\|summary\|full |  |  |
| limit | number |  | Number of results (default 10, max 50). |
| after | string |  | Pagination cursor from previous response nextCursor. |

### `news_get_detail` · read-only
Get full article content by news ID (returns title + summary + full original text). Use when user says 'show full article', 'read more', or provides a specific news ID from a previous result.

| param | type | req | description |
|---|---|---|---|
| id | string | ✓ | News article ID from a previous news_get_latest / news_get_by_coin / news_search result. Required. |
| language | en-US\|zh-CN |  | Content language: zh-CN or en-US. Infer from user's message. No server default. |

### `news_get_coin_sentiment` · read-only
Get sentiment snapshot or time-series trend for coins. Returns bullish/bearish ratios and mention counts. Pass trendPoints for trend data (1h->24 points, 4h->6, 24h->7). Use when user asks about coin sentiment, sentiment trend, or how bullish/bearish a coin is. For ranking all coins by sentiment, use news_get_sentiment_ranking instead.

| param | type | req | description |
|---|---|---|---|
| coins | string | ✓ | Comma-separated uppercase ticker symbols, max 20 (e.g. "BTC,ETH"). Normalize names/aliases to standard tickers. Required. |
| period | 1h\|4h\|24h |  | Aggregation granularity: 1h, 4h, 24h. Snapshot default: 24h. Trend default: 1h. |
| trendPoints | number |  | Trend data points. Pass for time-series trend; omit for snapshot. Guide: 1h->24, 4h->6, 24h->7. |

### `news_get_sentiment_ranking` · read-only
Get coin ranking by social hotness or sentiment direction. Use when user asks which coins are trending, most bullish/bearish coins. Sort by hot (mention count), bullish, or bearish. For sentiment data on a specific coin, use news_get_coin_sentiment instead.

| param | type | req | description |
|---|---|---|---|
| period | 1h\|4h\|24h |  | Aggregation granularity: 1h, 4h, 24h (default). |
| sortBy | hot\|bullish\|bearish |  | Sort: hot=by mentions (default), bullish=most bullish, bearish=most bearish. |
| limit | number |  | Number of results (default 10, max 50). |

### `news_get_economic_calendar` · read-only
Get macro-economic calendar data (GDP, CPI, NFP, interest rate decisions, PMI, etc.). Returns scheduled and released economic events with forecast, previous, and actual values. Use when user asks about economic calendar, macro data, or specific indicators like NFP/CPI/GDP/FOMC. Do NOT use for news articles or sentiment - use news_get_latest or news_search instead.

| param | type | req | description |
|---|---|---|---|
| region | string |  | Country/region filter in snake_case (e.g. united_states, euro_area, japan). Invalid values return empty results silently. If empty results, call news_list_calendar_regions to verify the value. |
| importance | 1\|2\|3 |  | Importance level: 1=low, 2=medium, 3=high. Omit for all levels. |
| before | string |  | Lower time bound - returns events NEWER than this timestamp (reversed semantics). Pair with 'after' for future-event windows. Unix ms. |
| after | string |  | Upper time bound - returns events OLDER than this timestamp (reversed semantics). Default=now (returns past events). Pair with 'before' for a bounded window. Unix ms. |
| limit | number |  | Number of results (default 100, max 100). |

### `news_get_domains` · read-only
List available news source domains (e.g. coindesk, cointelegraph). Use when user asks what news sources are available or which platforms are covered.

### `news_list_calendar_regions` · read-only
List all valid region values for the economic calendar. Returns a string array of snake_case region codes. Call this when economic-calendar returns empty results to verify the region value, or to help the user pick a valid region. Do NOT use to list news source platforms - use news_get_domains instead.

## grid (9)

### `grid_get_orders` · read-only
List grid bots. status='active' for running; 'history' for stopped.

| param | type | req | description |
|---|---|---|---|
| algoOrdType | grid\|contract_grid | ✓ | grid=Spot, contract_grid=Contract |
| status | active\|history |  | active=running (default); history=stopped |
| instId | string |  | e.g. BTC-USDT, BTC-USD-SWAP |
| algoId | string |  | Grid bot algo order ID (not a trade ordId) |
| after | string |  | Cursor for older records |
| before | string |  | Cursor for newer records |
| limit | number |  | Default 100 |

### `grid_get_order_details` · read-only
Get grid bot detail by algo ID. Returns config, status, PnL, and position.

| param | type | req | description |
|---|---|---|---|
| algoOrdType | grid\|contract_grid | ✓ | grid=Spot, contract_grid=Contract |
| algoId | string | ✓ | Grid bot algo order ID (not a trade ordId) |

### `grid_get_sub_orders` · read-only
Query sub-orders (grid trades) of a bot. type='filled' for executed; 'live' for pending.

| param | type | req | description |
|---|---|---|---|
| algoOrdType | grid\|contract_grid | ✓ | grid=Spot, contract_grid=Contract |
| algoId | string | ✓ | Grid bot algo order ID (not a trade ordId) |
| type | filled\|live |  | filled=executed trades (default); live=pending |
| groupId | string |  | A buy-sell pair shares the same groupId |
| after | string |  | Cursor for older records |
| before | string |  | Cursor for newer records |
| limit | number |  | Default 100 |

### `grid_create_order` · WRITE
Create grid bot (spot, USDT-margined, or coin-margined contract). [CAUTION] Locks funds. Spot: quoteSz|baseSz. Contract: direction+lever+sz.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | e.g. BTC-USDT, BTC-USDT-SWAP, BTC-USD-SWAP (coin-margined) |
| algoOrdType | grid\|contract_grid | ✓ | grid=Spot, contract_grid=Contract |
| maxPx | string | ✓ | Upper price |
| minPx | string | ✓ | Lower price |
| gridNum | string | ✓ | Number of grids |
| runType | 1\|2 |  | 1=arithmetic (default); 2=geometric |
| quoteSz | string |  | Spot: quote amount (e.g. USDT) |
| baseSz | string |  | Spot: base amount (e.g. BTC) |
| direction | long\|short\|neutral |  | Contract only |
| lever | string |  | Leverage. Contract only |
| sz | string |  | Margin in USDT or base coin (CoinM). Contract only |
| basePos | boolean |  | Open base position for contract. Default: true |
| tpTriggerPx | string |  | TP trigger price |
| slTriggerPx | string |  | SL trigger price |
| tpRatio | string |  | TP ratio e.g. 0.1=10%. Contract only |
| slRatio | string |  | SL ratio e.g. 0.1=10%. Contract only |
| algoClOrdId | string |  | User-defined ID. Alphanumeric, max 32, unique per user |

### `grid_amend_order` · WRITE
Amend a running grid bot. [CAUTION] Modifies a running bot. Use grid_list_orders to confirm the bot is running and obtain the algoId before calling.
Supports two modes, which can be combined in a single call:
• Price-range mode (maxPx+minPx+gridNum): change upper/lower price boundary and grid count. Contract grid: if new range requires more margin, pass topUpAmt; omit to auto-use the minimum required. Spot grid: topUpAmt is not supported.
• TP/SL mode (instId + any of tpTriggerPx/slTriggerPx/tpRatio/slRatio): update take-profit and/or stop-loss. Pass '-1' to explicitly clear an existing TP or SL. tpTriggerPx/slTriggerPx are absolute prices; tpRatio/slRatio are profit ratios (e.g. '0.1' = 10%).
When both sets of params are provided, both APIs are called sequentially.
Do NOT use to create a new grid bot - use grid_create_order instead. Do NOT use to stop a grid bot - use grid_stop_order instead.

| param | type | req | description |
|---|---|---|---|
| algoId | string | ✓ | Grid bot algo order ID (required) |
| maxPx | string |  | [Price-range mode] New upper price boundary. Triggers amend-algo-basic-param when provided. |
| minPx | string |  | [Price-range mode] New lower price boundary. Required when maxPx is set. |
| gridNum | string |  | [Price-range mode] New number of grid intervals (integer). Required when maxPx is set. |
| instId | string |  | [TP/SL mode] Instrument ID, e.g. BTC-USDT. Required when setting TP/SL. |
| tpTriggerPx | string |  | [TP/SL mode] Take-profit trigger price (absolute). Pass '-1' to clear. |
| slTriggerPx | string |  | [TP/SL mode] Stop-loss trigger price (absolute). Pass '-1' to clear. |
| tpRatio | string |  | [TP/SL mode] Take-profit ratio, e.g. '0.1' = 10% profit. Pass '-1' to clear. |
| slRatio | string |  | [TP/SL mode] Stop-loss ratio, e.g. '0.1' = 10% drawdown. Pass '-1' to clear. |
| topUpAmt | string |  | Top-up amount. In price-range mode maps to topupAmount (contract grid only; omit to use minimum required). In TP/SL mode maps to topUpAmt. |

### `grid_stop_order` · WRITE
[CAUTION] Stop a grid bot or close its remaining open position — real trades, irreversible. Workflow: (1) If the user has not specified which bot to stop, call grid_get_orders first and ask the user to confirm which bot before proceeding. (2) Call grid_get_order_details to check the current 'state' field. (3) If state='running' → call this tool: stopType='1' (default, clean exit) — spot grid sells all base assets back to quote; contract grid market-closes all positions. stopType='2' (keep assets) — spot grid keeps base assets as-is; contract grid cancels grid orders but leaves the position open. (4) If state='no_close_position' → call this tool with stopType='1' to close the remaining open position.

| param | type | req | description |
|---|---|---|---|
| algoId | string | ✓ | Grid bot algo order ID (not a trade ordId) |
| algoOrdType | grid\|contract_grid | ✓ | grid=Spot grid, contract_grid=Contract grid |
| instId | string | ✓ | Instrument ID, e.g. BTC-USDT, BTC-USDT-SWAP |
| stopType | 1\|2 |  | '1' (default): stop strategy and sell - spot grid sells all base assets back to quote; contract grid market-closes all positions. '2': stop strategy without selling - spot grid keeps base assets as-is; contract grid cancels all grid orders but leaves the position open. After stopType='2', the remaining position can be closed manually from the Positions page. |

### `grid_get_positions` · read-only
Get open contract-grid positions for an active or recently-stopped contract-grid bot. Returns liquidation price, margin ratio, and unrealized PnL.

| param | type | req | description |
|---|---|---|---|
| algoId | string | ✓ | Grid bot algo order ID |
| algoOrdType | contract_grid | ✓ | Must be contract_grid |

### `grid_get_liquidate_price` · read-only
Estimate the liquidation price for a contract-grid bot before creating it. Contract grid only. Requires the full intended config: instId, sz (margin), lever, the grid range (maxPx, minPx, gridNum) and direction. runType defaults to arithmetic ('1'); triggerStrategy is optional.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | Instrument ID, e.g. BTC-USDT-SWAP |
| sz | string | ✓ | Margin size in USDT (or base coin for CoinM) |
| lever | string | ✓ | Leverage, e.g. '5' |
| direction | long\|short\|neutral | ✓ | Bot direction (pass 'neutral' for a neutral bot) |
| basePos | boolean |  | Whether the base position is opened |
| maxPx | string | ✓ | Upper price of the grid range |
| minPx | string | ✓ | Lower price of the grid range |
| gridNum | string | ✓ | Number of grids |
| runType | 1\|2 |  | 1=arithmetic (default); 2=geometric |
| triggerStrategy | instant\|price\|rsi\|webhook |  | Entry trigger strategy for the intended bot |

### `grid_close_position` · WRITE
[CAUTION] Close the remaining open position of a contract-grid bot that was stopped with stopType='2'. Use grid_get_positions first to confirm the position exists and check its size before closing. Use mktClose=true for an immediate market close, or mktClose=false to place a limit close order (provide sz and px).

| param | type | req | description |
|---|---|---|---|
| algoId | string | ✓ | Grid bot algo order ID |
| mktClose | boolean | ✓ | Required, no default (fund-moving): true=market close immediately; false=limit close (requires sz and px). |
| sz | string |  | Close size (required when mktClose=false) |
| px | string |  | Limit price (required when mktClose=false) |

## dca (5)

### `dca_create_order` · WRITE
Create a DCA (Martingale) bot. [CAUTION] Real trades. contract_dca requires lever; spot_dca must be long. If maxSafetyOrds>0: need safetyOrdAmt, pxSteps.

| param | type | req | description |
|---|---|---|---|
| instId | string | ✓ | BTC-USDT (spot) or BTC-USDT-SWAP (contract) |
| algoOrdType | spot_dca\|contract_dca | ✓ |  |
| lever | string |  | Required for contract_dca |
| direction | long\|short | ✓ |  |
| initOrdAmt | string | ✓ | Initial order amount in quote ccy (spot_dca) or margin in quote ccy (contract_dca) |
| maxSafetyOrds | string | ✓ | 0=no DCA, max 100 |
| tpPct | string | ✓ | Take-profit ratio, 0.03=3% |
| safetyOrdAmt | string |  | Safety order amount in quote ccy (spot_dca) or margin in quote ccy (contract_dca). Need if maxSafetyOrds>0 |
| pxSteps | string |  | Price drop per safety order. Need if maxSafetyOrds>0 |
| pxStepsMult | string |  | Step multiplier. Required when maxSafetyOrds>0, e.g. '1' |
| volMult | string |  | Size multiplier. Required when maxSafetyOrds>0, e.g. '1' |
| slPct | string |  | Stop-loss ratio, 0.05=5% |
| slMode | limit\|market |  |  |
| allowReinvest | boolean |  | Default true |
| triggerStrategy | instant\|price\|rsi |  | contract_dca: instant\|price\|rsi; spot_dca: instant\|rsi. Default: instant |
| triggerPx | string |  | Need if triggerStrategy=price (contract_dca only) |
| triggerCond | cross_up\|cross_down |  | Required when triggerStrategy=rsi. Optional when triggerStrategy=price |
| thold | string |  | RSI threshold (e.g. '30'). Need if triggerStrategy=rsi |
| timeframe | string |  | RSI timeframe (e.g. '15m'). Need if triggerStrategy=rsi |
| timePeriod | string |  | RSI period. Default '14'. Optional when triggerStrategy=rsi |
| algoClOrdId | string |  | Client order ID, 1-32 chars |
| reserveFunds | string |  | spot_dca only. 'true' or 'false', default 'true'. Reserves funds for safety orders at bot creation. |
| tradeQuoteCcy | string |  |  |

### `dca_stop_order` · WRITE
[CAUTION] Stop a DCA bot or close its remaining open position — real trades, irreversible. Workflow: (1) If the user has not specified which bot to stop, call dca_get_orders first and ask the user to confirm which bot before proceeding. (2) Call dca_get_order_details to check the current 'state' field. (3) If state='running' → call this tool. (4) If state='no_close_position' → call this tool with stopType='1' to close the remaining open position. spot_dca requires stopType: 1=sell all tokens, 2=keep tokens.

| param | type | req | description |
|---|---|---|---|
| algoId | string | ✓ | Algo order ID |
| algoOrdType | spot_dca\|contract_dca | ✓ |  |
| stopType | 1\|2 |  | Required for spot_dca: 1=sell all, 2=keep tokens |

### `dca_get_orders` · read-only
List DCA bots. Default: active (running). Use status=history for stopped.

| param | type | req | description |
|---|---|---|---|
| status | active\|history |  |  |
| algoOrdType | spot_dca\|contract_dca |  | Default: contract_dca |
| algoId | string |  | Algo order ID |
| instId | string |  |  |
| after | string |  | Pagination cursor (older data) |
| before | string |  | Pagination cursor (newer data) |
| limit | number |  |  |

### `dca_get_order_details` · read-only
Get DCA bot position details (avgPx, upl, liqPx, etc).

| param | type | req | description |
|---|---|---|---|
| algoId | string | ✓ | Algo order ID |
| algoOrdType | spot_dca\|contract_dca | ✓ |  |

### `dca_get_sub_orders` · read-only
Get DCA cycles or orders in a cycle. Omit cycleId=cycle list; with cycleId=orders. Supports after/before/limit pagination in both branches.

| param | type | req | description |
|---|---|---|---|
| algoId | string | ✓ | Algo order ID |
| algoOrdType | spot_dca\|contract_dca | ✓ |  |
| cycleId | string |  | Omit for cycles; provide for orders |
| after | string |  | Pagination cursor (older data) |
| before | string |  | Pagination cursor (newer data) |
| limit | number |  |  |

## earn (12)

### `earn_get_savings_balance` · read-only
Get Simple Earn (savings/flexible earn) balance. Returns current holdings for all currencies or a specific one. To show market rates alongside balance, call earn_get_lending_rate_history. To browse available fixed-term products with quota info, use earn_get_fixed_earn_products. Do NOT use for fixed-term order queries — use earn_get_fixed_order_list instead.

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | e.g. USDT or BTC. Omit for all. |

### `earn_get_fixed_order_list` · read-only
Get Simple Earn Fixed (定期赚币) lending order list. Returns orders sorted by creation time descending. Use this to check status of fixed-term lending orders (pending/earning/expired/settled/cancelled). Do NOT use for flexible earn balance - use earn_get_savings_balance instead. If the result is empty, do NOT display any fixed-term section in the output.

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | Currency, e.g. USDT. Omit for all. |
| state | string |  | Order state: pending (匹配中), earning (赚币中), expired (逾期), settled (已结算), cancelled (已撤销). Omit for all. |

### `earn_savings_purchase` · WRITE
Purchase Simple Earn (savings/flexible earn). [CAUTION] Moves real funds into earn product.

| param | type | req | description |
|---|---|---|---|
| ccy | string | ✓ | Currency to purchase, e.g. USDT |
| amt | string | ✓ | Purchase amount |
| rate | string |  | Minimum lending rate threshold (annual, decimal). e.g. 0.01 = 1%. Only matched when market rate ≥ this value. Defaults to 0.01. Keep at 0.01 to maximize matching probability - do NOT raise this to increase yield, as actual yield (lendingRate) is determined by market supply/demand, not this setting. |

### `earn_savings_redeem` · WRITE
Redeem Simple Earn (savings/flexible earn). [CAUTION] Withdraws funds from earn product.

| param | type | req | description |
|---|---|---|---|
| ccy | string | ✓ | Currency to redeem, e.g. USDT |
| amt | string | ✓ | Redemption amount |

### `earn_set_lending_rate` · WRITE
Set lending rate for Simple Earn. [CAUTION] Changes your lending rate preference.

| param | type | req | description |
|---|---|---|---|
| ccy | string | ✓ | Currency, e.g. USDT |
| rate | string | ✓ | Minimum lending rate threshold (annual, decimal). e.g. 0.01 = 1%. Only matched when market rate ≥ this value. Keep at 0.01 to maximize matching probability - do NOT raise this to increase yield, as actual yield (lendingRate) is determined by market supply/demand, not this setting. |

### `earn_get_lending_history` · read-only
Get personal lending records for Simple Earn (your own lending history). NOT for market rate queries. Returns your lending records with amount, rate, and earnings data.

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | e.g. USDT. Omit for all. |
| after | string |  | Pagination: before this record ID |
| before | string |  | Pagination: after this record ID |
| limit | number |  | Max results (default 100) |

### `earn_fixed_purchase` · WRITE
Purchase Simple Earn Fixed (定期) product, two-step flow. First call (confirm omitted or false): returns purchase preview with product details and risk warning. Preview offer fields: lendQuota = remaining quota, soldOut = whether product is sold out (lendQuota is 0). YOU MUST display the 'warning' field from the preview response to the user VERBATIM before asking for confirmation — do NOT omit or summarize it. Second call (confirm=true): executes the purchase. Only proceed after the user explicitly confirms. IMPORTANT: Orders in 'pending' (匹配中) state can still be cancelled via earn_fixed_redeem; once the status changes to 'earning' (赚币中), funds are LOCKED until maturity - no early redemption allowed.

| param | type | req | description |
|---|---|---|---|
| ccy | string | ✓ | Currency, e.g. USDT |
| amt | string | ✓ | Purchase amount |
| term | string | ✓ | Term, e.g. 90D |
| confirm | boolean |  | Omit or false on the first call to preview the purchase details; set to true on the second call to execute after user confirms. |

### `earn_fixed_redeem` · WRITE
Redeem Simple Earn Fixed (定期赚币) order. [CAUTION] Redeems a fixed-term lending order. Always redeems the full order amount. Only orders in 'pending' (匹配中) state can be redeemed - orders in 'earning' state are locked until maturity and cannot be redeemed early. Do NOT use for flexible earn redemption - use earn_savings_redeem instead.

| param | type | req | description |
|---|---|---|---|
| reqId | string | ✓ | Request ID of the fixed-term order to redeem |

### `earn_get_lending_rate_history` · read-only
Query Simple Earn lending rates and fixed-term offers. Use this tool when the user asks about Simple Earn products, current or historical lending rates, or when displaying savings balance with market rate context (市场均利率). Returns lending rate history (lendingRate field, newest-first) AND available fixed-term (定期) offers with APR, term, min amount, and quota — one call gives a complete view of both flexible and fixed options. In fixedOffers: lendQuota = remaining quota, soldOut = whether product is sold out (lendQuota is 0). For dedicated fixed-term product queries, use earn_get_fixed_earn_products. To get current flexible APY: use limit=1 and read lendingRate.

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | e.g. USDT. Omit for all. |
| after | string |  | Pagination: before this timestamp (ms) |
| before | string |  | Pagination: after this timestamp (ms) |
| limit | number |  | Max results (default 7) |

### `earn_get_fixed_earn_products` · read-only
Query available Simple Earn Fixed-term products. Returns fixed-term offers with APR, term, min investment, and remaining quota. Use to check available products and quota before purchasing. Do NOT use for querying your own orders — use earn_get_fixed_order_list instead. Do NOT use just for current flexible APY -- use earn_get_lending_rate_history with limit=1 instead.

| param | type | req | description |
|---|---|---|---|
| ccy | string |  | e.g. USDT. Omit for all currencies. |

### `earn_auto_set` · WRITE
Enable or disable auto-earn for a currency. earnType='0' for auto-lend+stake (most currencies); earnType='1' for USDG earn (USDG, BUIDL). Use account_get_balance first: if autoLendStatus or autoStakingStatus != 'unsupported', use earnType='0'; for USDG/BUIDL use earnType='1'. [CAUTION] Cannot disable within 24h of enabling.

| param | type | req | description |
|---|---|---|---|
| ccy | string | ✓ | Currency, e.g. SOL, USDG |
| action | string | ✓ | turn_on or turn_off |
| earnType | string |  | 0=auto-lend+stake (default), 1=USDG earn. Omit to use default. |

### `earn_get_flash_earn_projects` · read-only
Get Flash Earn projects. Use this to browse upcoming or in-progress Flash Earn opportunities. Do NOT use for purchase or redeem actions - Flash Earn is query-only in this module.

| param | type | req | description |
|---|---|---|---|
| status | array |  | Status filter. 0=upcoming, 100=in-progress. Defaults to [0,100]. |

## onchain (6)

### `onchain_earn_get_offers` · read-only
List staking/DeFi products with APY, terms, and limits. Always show protocol name (protocol field) and earnings currency (earningData[].ccy) when presenting results.

| param | type | req | description |
|---|---|---|---|
| productId | string |  | Product ID filter. |
| protocolType | string |  | staking\|defi |
| ccy | string |  | e.g. ETH |

### `onchain_earn_purchase` · WRITE
Invest in a staking/DeFi product. [CAUTION] Moves real funds.

| param | type | req | description |
|---|---|---|---|
| productId | string | ✓ | Product ID |
| investData | array | ✓ | Array of {ccy, amt} to invest. |
| term | string |  | Investment term in days, required for fixed-term products. |
| tag | string |  | Order tag. |

### `onchain_earn_redeem` · WRITE
Redeem a staking/DeFi investment. [CAUTION] Some products have lock periods, early redemption may incur penalties.

| param | type | req | description |
|---|---|---|---|
| ordId | string | ✓ | Order ID |
| protocolType | string | ✓ | staking\|defi |
| allowEarlyRedeem | boolean |  | Allow early exit for fixed-term products, may incur penalties. Default: false. |

### `onchain_earn_cancel` · WRITE
Cancel a pending staking/DeFi purchase order. [CAUTION]

| param | type | req | description |
|---|---|---|---|
| ordId | string | ✓ | Order ID |
| protocolType | string | ✓ | staking\|defi |

### `onchain_earn_get_active_orders` · read-only
List current active staking/DeFi investments.

| param | type | req | description |
|---|---|---|---|
| productId | string |  | Product ID filter. |
| protocolType | string |  | staking\|defi |
| ccy | string |  | e.g. ETH |
| state | string |  | 8=pending, 13=cancelling, 9=onchain, 1=earning, 2=redeeming |

### `onchain_earn_get_order_history` · read-only
List past staking/DeFi orders including redeemed ones.

| param | type | req | description |
|---|---|---|---|
| productId | string |  | Product ID filter. |
| protocolType | string |  | staking\|defi |
| ccy | string |  | e.g. ETH |
| after | string |  | Cursor: results older than this order ID. |
| before | string |  | Cursor: results newer than this order ID. |
| limit | string |  | Max results (default 100, max 100). |

## dcd (6)

### `dcd_get_currency_pairs` · read-only
Get available DCD currency pairs.

### `dcd_get_products` · read-only
Get DCD products with yield and quota info. Yields in response are decimal fractions, not percentages.

| param | type | req | description |
|---|---|---|---|
| baseCcy | string | ✓ | Base currency, e.g. BTC |
| quoteCcy | string | ✓ | Quote currency, e.g. USDT |
| optType | string | ✓ | Option type: C (Call, sell high) or P (Put, buy low) |

### `dcd_get_order_state` · read-only
Check DCD order state after subscription (returns ordId + state only). For full order details (productId, strike, yield, settlement info), use dcd_get_orders instead.

| param | type | req | description |
|---|---|---|---|
| ordId | string | ✓ | Order ID |

### `dcd_get_orders` · read-only
Get DCD order history. Yields in response are decimal fractions, not percentages.

| param | type | req | description |
|---|---|---|---|
| ordId | string |  | Filter by order ID (overrides other filters) |
| productId | string |  | e.g. BTC-USDT-260327-77000-C |
| uly | string |  | Underlying index, e.g. BTC-USD |
| state | string |  | Filter by state: initial \| live \| pending_settle \| settled \| pending_redeem \| redeemed \| rejected |
| beginId | string |  | Cursor for newer records |
| endId | string |  | Cursor for older records |
| begin | string |  | Begin timestamp, Unix ms |
| end | string |  | End timestamp, Unix ms |
| limit | number |  | Default 100 |

### `dcd_subscribe` · WRITE
Subscribe to a DCD product: get quote and execute atomically. Confirm product, amount, and currency with user before calling. Optional minAnnualizedYield rejects the order if quote yield falls below threshold. Returns order result with quote snapshot (minAnnualizedYield is in percent; response yields are decimal fractions).

| param | type | req | description |
|---|---|---|---|
| productId | string | ✓ | Product ID, e.g. BTC-USDT-260327-77000-C |
| notionalSz | string | ✓ | Investment amount (the quantity to invest, e.g. '0.1' for 0.1 BTC). This is the 'sz' / 'size' field for DCD. |
| notionalCcy | string | ✓ | Investment currency: baseCcy for CALL (C), quoteCcy for PUT (P) |
| clOrdId | string |  | Client order ID for idempotency (optional) |
| minAnnualizedYield | number |  | Minimum acceptable annualized yield in percent (e.g. 18 means 18%). Order will NOT be placed if the quote yield is below this threshold. |

### `dcd_redeem` · WRITE
Early redemption of a DCD order, two-step flow. First call (no quoteId): returns redemption quote for user confirmation. Second call (with quoteId): executes redemption. If the quote expired, auto-refreshes and executes; response includes autoRefreshedQuote: true.

| param | type | req | description |
|---|---|---|---|
| ordId | string | ✓ | Order ID to redeem early |
| quoteId | string |  | Redeem quote ID returned by the first dcd_redeem call. Omit on the first call to preview the exit cost; provide on the second call to execute. |

## smartmoney (10)

### `smartmoney_get_traders_by_filter` · read-only
Leaderboard ranking of OKX smart-money traders, filtered by pool conditions and ranked by `sortBy`. Use when: discovering top performers by criteria (PnL / win-rate / drawdown / AUM). See also: `smartmoney_get_performance_by_trader` (lookup by ID), `smartmoney_search_trader` (lookup by nickname). Note: `updateTime` is 12-digit `yyyyMMddHHmm` UTC+8, different from signal tools' 10-digit UTC `asOfTime`/`dataVersion` - do not cross-pass.

| param | type | req | description |
|---|---|---|---|
| updateTime | string |  | Snapshot version key - 12-digit `yyyyMMddHHmm` (UTC+8) as a string, e.g. `"202604301815"`. Omit to query the latest snapshot (refreshed every ~5 min). |
| sortBy | pnl\|pnlRatio | ✓ | Required. Leaderboard sort key. `pnl` = absolute USD profit; `pnlRatio` = percentage return. Default `"pnl"`. |
| period | 3\|7\|30\|90 | ✓ | Required. Performance lookback window in days. One of `"3"` / `"7"` / `"30"` / `"90"`. Default `"90"` (matches leaderboard UI). Filters AND ranks traders by their PnL over that window. |
| minPnl | string |  | Minimum absolute PnL in USD as a string, e.g. `"10000"` -> traders with PnL ≥ $10,000. Numeric threshold - distinct from the signal-side `pnlTier` percentile enum. |
| minWinRate | string |  | Minimum win-rate as a decimal in 0~1 range, passed as a string, e.g. `"0.8"` -> traders with win-rate ≥ 80%. Numeric threshold - distinct from the signal-side `winRateTier` enum. |
| maxDrawdown | string |  | Maximum drawdown as a decimal, passed as a string, e.g. `"0.1"` -> traders with drawdown ≤ 10%. Lower = lower risk. Numeric threshold - distinct from the signal-side `maxDrawdownTier` enum. |
| minAum | string |  | Minimum AUM (Assets Under Management) in USD as a string, e.g. `"1000"` -> traders with AUM ≥ $1,000. Numeric threshold - distinct from the signal-side `aumTier` percentile enum. |
| after | string |  | Pagination cursor (older page) - pass the `authorId` of the last item from the previous page as a string, e.g. `"872913470357110787"`. Cursor anchors on `authorId` while preserving the current `sortBy` order. |
| before | string |  | Pagination cursor (newer page) - pass the `authorId` of the first item from the previous page as a string, e.g. `"872913470357110787"`. Cursor anchors on `authorId` while preserving the current `sortBy` order. |
| limit | integer |  | Max results per page (default 10, max 100). |

### `smartmoney_get_performance_by_trader` · read-only
PnL / win-rate / drawdown profile for one or more traders looked up by `authorIds`. Use when: caller already has trader IDs and needs their performance metrics. See also: `smartmoney_search_trader` (resolve nickname -> authorId), `smartmoney_get_traders_by_filter` (criteria-based discovery). Note: response `updateTime` is 12-digit `yyyyMMddHHmm` UTC+8 - do not pass to signal-side tools' `asOfTime` (10-digit UTC).

| param | type | req | description |
|---|---|---|---|
| authorIds | array | ✓ | Trader IDs to look up, e.g. `["1001", "1002"]`. Required. |
| sortBy | pnl\|pnlRatio | ✓ | Required. Result sort key. `pnl` = absolute USD profit; `pnlRatio` = percentage return. Default `"pnl"`. |
| period | 3\|7\|30\|90 | ✓ | Required. Performance lookback window in days. One of `"3"` / `"7"` / `"30"` / `"90"`. Default `"90"`. |

### `smartmoney_get_trader_positions` · read-only
Currently-open positions held by a single trader (direction, size, leverage, entry, conviction). Use when: inspecting what a top trader is holding RIGHT NOW. See also: `smartmoney_get_trader_positions_history` (closed positions), `smartmoney_search_trader` (nickname -> authorId), `smartmoney_get_traders_by_filter` (discover trader).

| param | type | req | description |
|---|---|---|---|
| authorId | string | ✓ | Trader's unique ID (obtain from `smartmoney_get_traders_by_filter`). |
| instId | string |  | Optional instrument filter. Accepts either full instId (e.g. "BTC-USDT-SWAP") or bare base currency (e.g. "BTC") - the handler extracts the base currency for the upstream filter. |

### `smartmoney_get_trader_positions_history` · read-only
Closed-position history of a single trader, paginated by `posId` cursor. Use when: studying realized PnL pattern, holding duration, win/loss streaks, or how positions ended (closed vs liquidated). See also: `smartmoney_get_trader_positions` (currently-open), `smartmoney_search_trader` (nickname -> authorId), `smartmoney_get_traders_by_filter` (discover trader).

| param | type | req | description |
|---|---|---|---|
| authorId | string | ✓ | Trader's unique ID (obtain from `smartmoney_get_traders_by_filter`). |
| instId | string |  | Optional instrument filter. Accepts either full instId (e.g. "BTC-USDT-SWAP") or bare base currency (e.g. "BTC") - the handler extracts the base currency for the upstream filter. |
| after | string |  | Pagination cursor (older) - returns positions with `posId` smaller than this value. Pass the `posId` as a string, e.g. `"872913470357110787"`. |
| before | string |  | Pagination cursor (newer) - returns positions with `posId` greater than this value. Pass the `posId` as a string, e.g. `"872913470357110787"`. |
| limit | integer |  | Max positions per page (default 10, max 100). |

### `smartmoney_get_trader_orders_history` · read-only
Recent orders/fills placed by a single trader (direction, size, price, leverage), paginated by `ordId` cursor. Aligned with the cross-module `*_get_orders` family. Use when: tracking a top trader's latest trade activity. See also: `smartmoney_search_trader` (nickname -> authorId), `smartmoney_get_traders_by_filter` (discover trader).

| param | type | req | description |
|---|---|---|---|
| authorId | string | ✓ | Trader's unique ID (obtain from `smartmoney_get_traders_by_filter`). |
| instId | string |  | Optional instrument filter. Accepts either full instId (e.g. "BTC-USDT-SWAP") or bare base currency (e.g. "BTC") - the handler extracts the base currency for the upstream filter. |
| after | string |  | Pagination cursor (older) - returns trades with `ordId` smaller than this value. Pass the `ordId` as a string, e.g. `"872913470357110787"`. |
| before | string |  | Pagination cursor (newer) - returns trades with `ordId` greater than this value. Pass the `ordId` as a string, e.g. `"872913470357110787"`. |
| limit | integer |  | Max trades per page (default 10, max 100). |

### `smartmoney_search_trader` · read-only
Search Top Traders by nickname keyword, ranked by OKX-platform follower count DESC. Returns up to 10 matches; intersects KOL full-text recall with the Top Trader set. Use when: resolving a nickname or partial name to `authorId`(s) before calling other `smartmoney_get_trader_*` tools. See also: `smartmoney_get_traders_by_filter` (discover top performers by criteria), `smartmoney_get_performance_by_trader` (lookup by known authorId).

| param | type | req | description |
|---|---|---|---|
| keyword | string | ✓ | Nickname search keyword. Required, must be non-empty / non-whitespace. Matched candidates are intersected with the Top Trader set. |

### `smartmoney_get_signal_overview_by_filter` · read-only
Multi-asset smart-money consensus signals (long/short ratio, weighted entry, capital flow, deltas vs 1h/24h/7d), aggregated over a tier-filtered trader pool (PnL / win-rate / drawdown / AUM). Pick instruments via `topInstruments` OR `instCcyList` - exactly one. Snapshot time auto-resolved to current hour. **Linear (USDT/USDS-margined) contracts only - coin-margined (`-USD-SWAP` / `-USD-DELIVERY`) positions are excluded by upstream and silently omitted from the aggregation.** Use when: latest cross-asset consensus from a criteria-defined pool. See also: `smartmoney_get_signal_overview_by_trader` (restrict pool to specific traders), `smartmoney_get_signal_trend_by_filter` (time-series instead of latest snapshot).

| param | type | req | description |
|---|---|---|---|
| topInstruments | integer |  | Top-N hottest instruments to aggregate (sorted by `tradersWithPosition` DESC). Mutually exclusive with `instCcyList`; one of the two is required (default 20 if neither provided). |
| instCcyList | array |  | Base currencies to aggregate, e.g. `["BTC", "ETH", "SOL"]`. Mutually exclusive with `topInstruments`. Scope: only USDT-margined and USDS-margined (linear) instruments - e.g. `BTC` covers `BTC-USDT-SWAP` + `BTC-USDS-SWAP`. Coin-margined contracts (`BTC-USD-SWAP`, `BTC-USD-DELIVERY`) are NOT included; positions a trader holds in those instruments are silently dropped from the aggregation. |
| sortBy | pnl\|pnlRatio | ✓ | Ranking key used to pick traders into the aggregation pool. `pnl` = absolute USD profit (favors high-AUM whales); `pnlRatio` = percentage return (favors small-but-efficient traders). |
| period | 3\|7\|30\|90 | ✓ | Lookback window in days. One of `"3"` / `"7"` / `"30"` / `"90"`. Drives capability metrics (avgLongWinRate / avgShortWinRate) and the `winRateTier` filter. Does NOT affect signal fields (which always use the latest snapshot). |
| pnlTier | PNL_ANY\|PNL_TOP50\|PNL_TOP20\|PNL_TOP5 |  | PnL percentile gate. Naming: `TOP{N}` = top N% percentile (NOT an absolute PnL value). PNL_ANY = no filter; PNL_TOP50 = PnL ≥ P50 (median); PNL_TOP20 = ≥ P80; PNL_TOP5 = ≥ P95. PnL distribution is long-tailed - use percentile, not absolute thresholds. |
| winRateTier | WR_ANY\|WR_GE_50\|WR_GE_80 |  | Minimum win-rate gate (absolute thresholds, NOT percentile). Naming: `GE_{N}` = career win-rate ≥ N% - distinct from `pnlTier`/`aumTier` `TOP{N}` which are percentiles. WR_ANY = no filter; WR_GE_50 = ≥ 50%; WR_GE_80 = ≥ 80%. |
| maxDrawdownTier | MR_ANY\|MR_LE_20\|MR_LE_50 |  | Maximum-drawdown gate (absolute thresholds, NOT percentile; smaller drawdown = lower risk). Naming: `LE_{N}` = drawdown ≤ N% - distinct from `pnlTier`/`aumTier` `TOP{N}` which are percentiles. MR_ANY = no filter; MR_LE_20 = drawdown ≤ 20%; MR_LE_50 = ≤ 50%. |
| aumTier | AUM_ANY\|AUM_TOP50\|AUM_TOP20\|AUM_TOP5 |  | AUM (Assets Under Management) percentile gate. Naming: `TOP{N}` = top N% percentile (NOT an absolute USD amount). AUM_ANY = no filter; AUM_TOP50 = AUM ≥ P50; AUM_TOP20 = ≥ P80; AUM_TOP5 = ≥ P95. AUM is long-tailed - use percentile, not absolute USD. |
| lmtNum | integer |  | Upper bound on `tradersQualified` (final aggregation pool size). Candidates pass through tier filters (`pnlTier` / `winRateTier` / `aumTier` / `maxDrawdownTier`), then are truncated to top-N by `sortBy` (DESC). `tradersQualified` ≤ `lmtNum` always; equals `lmtNum` unless candidate pool underflows (rare ccy / strict tier combos). Default 100; values above ~1500 add latency without benefit (exceeds typical candidate pool size). |

### `smartmoney_get_signal_overview_by_trader` · read-only
Multi-asset smart-money signals aggregated over a hand-picked set of traders (`authorIds`). Pick instruments via `topInstruments` OR `instCcyList`. Capability tier filters (pnlTier / winRateTier / etc.) not exposed - backend uses defaults for direct-lookup scenarios. **Linear (USDT/USDS-margined) contracts only - a trader's coin-margined (`-USD-SWAP` / `-USD-DELIVERY`) positions are silently excluded from the aggregation, even when those positions are large.** Use `smartmoney_get_trader_positions` if the full position book is needed. Use when: caller already knows which traders to follow and wants their cross-asset consensus at the latest hour. See also: `smartmoney_get_signal_overview_by_filter` (criteria-defined pool), `smartmoney_get_signal_trend_by_trader` (time-series), `smartmoney_get_traders_by_filter` / `smartmoney_search_trader` (discover authorIds).

| param | type | req | description |
|---|---|---|---|
| authorIds | array | ✓ | Trader IDs to aggregate over, e.g. `["1001", "1002"]`. Required. |
| topInstruments | integer |  | Top-N hottest instruments held by the given traders (sorted by `tradersWithPosition` DESC). Mutually exclusive with `instCcyList`; one of the two is required (default 20 if neither provided). |
| instCcyList | array |  | Base currencies to aggregate, e.g. `["BTC", "ETH", "SOL"]`. Mutually exclusive with `topInstruments`. Scope: only USDT-margined and USDS-margined (linear) instruments - e.g. `BTC` covers `BTC-USDT-SWAP` + `BTC-USDS-SWAP`. Coin-margined contracts (`BTC-USD-SWAP`, `BTC-USD-DELIVERY`) are NOT included; the trader's positions in those instruments are silently dropped. |
| sortBy | pnl\|pnlRatio | ✓ | Required. Ranking key for the trader set. `pnl` = absolute USD profit; `pnlRatio` = percentage return. Default `"pnl"`. |
| period | 3\|7\|30\|90 | ✓ | Required. Lookback window in days for capability metrics (`winRate.avgLongWinRate` / `avgShortWinRate`). One of `"3"` / `"7"` / `"30"` / `"90"`. Default `"7"`. Does NOT affect signal fields. |

### `smartmoney_get_signal_trend_by_filter` · read-only
Time-series of single-asset smart-money signal across hourly/daily buckets, aggregated over a tier-filtered trader pool. Returns the latest `limit` buckets ending at `asOfTime` (defaults to current UTC hour). **Linear (USDT/USDS-margined) contracts only - coin-margined (`-USD-SWAP` / `-USD-DELIVERY`) positions are excluded by upstream and silently omitted.** Use when: tracking how long/short conviction and capital evolve over time (smart money adding exposure or retreating). See also: `smartmoney_get_signal_overview_by_filter` (latest snapshot only), `smartmoney_get_signal_trend_by_trader` (restrict to specific traders). Note: `asOfTime` is 10-digit `yyyyMMddHH` UTC, different from leaderboard tools' 12-digit UTC+8 `updateTime` - do not cross-pass.

| param | type | req | description |
|---|---|---|---|
| instCcy | string | ✓ | Base currency to scope the time-series, e.g. "BTC". Required. Scope: USDT-margined and USDS-margined (linear) instruments only - coin-margined (`-USD-SWAP` / `-USD-DELIVERY`) positions are NOT included. |
| asOfTime | string |  | Anchor snapshot time - 10-digit `yyyyMMddHH` UTC as a string, e.g. `"2026050100"`. Returns the latest `limit` buckets ending at this anchor. Omit to use the current UTC hour. |
| granularity | 1h\|1d | ✓ | Time-bucket size. `1h` = hourly snapshots (intraday/short-term trend), `1d` = daily snapshots (multi-day trend). |
| limit | integer |  | Number of buckets to return (newest first), ending at `asOfTime`. Default 24, max 500. |
| sortBy | pnl\|pnlRatio | ✓ | Ranking key used to pick traders into the aggregation pool. `pnl` = absolute USD profit (favors high-AUM whales); `pnlRatio` = percentage return (favors small-but-efficient traders). |
| period | 3\|7\|30\|90 | ✓ | Lookback window in days. One of `"3"` / `"7"` / `"30"` / `"90"`. Drives capability metrics (avgLongWinRate / avgShortWinRate) and the `winRateTier` filter. Does NOT affect signal fields (which always use the latest snapshot). |
| pnlTier | PNL_ANY\|PNL_TOP50\|PNL_TOP20\|PNL_TOP5 |  | PnL percentile gate. Naming: `TOP{N}` = top N% percentile (NOT an absolute PnL value). PNL_ANY = no filter; PNL_TOP50 = PnL ≥ P50 (median); PNL_TOP20 = ≥ P80; PNL_TOP5 = ≥ P95. PnL distribution is long-tailed - use percentile, not absolute thresholds. |
| winRateTier | WR_ANY\|WR_GE_50\|WR_GE_80 |  | Minimum win-rate gate (absolute thresholds, NOT percentile). Naming: `GE_{N}` = career win-rate ≥ N% - distinct from `pnlTier`/`aumTier` `TOP{N}` which are percentiles. WR_ANY = no filter; WR_GE_50 = ≥ 50%; WR_GE_80 = ≥ 80%. |
| maxDrawdownTier | MR_ANY\|MR_LE_20\|MR_LE_50 |  | Maximum-drawdown gate (absolute thresholds, NOT percentile; smaller drawdown = lower risk). Naming: `LE_{N}` = drawdown ≤ N% - distinct from `pnlTier`/`aumTier` `TOP{N}` which are percentiles. MR_ANY = no filter; MR_LE_20 = drawdown ≤ 20%; MR_LE_50 = ≤ 50%. |
| aumTier | AUM_ANY\|AUM_TOP50\|AUM_TOP20\|AUM_TOP5 |  | AUM (Assets Under Management) percentile gate. Naming: `TOP{N}` = top N% percentile (NOT an absolute USD amount). AUM_ANY = no filter; AUM_TOP50 = AUM ≥ P50; AUM_TOP20 = ≥ P80; AUM_TOP5 = ≥ P95. AUM is long-tailed - use percentile, not absolute USD. |
| lmtNum | integer |  | Upper bound on `tradersQualified` per bucket (final aggregation pool size). Candidates pass through tier filters (`pnlTier` / `winRateTier` / `aumTier` / `maxDrawdownTier`), then are truncated to top-N by `sortBy` (DESC). `tradersQualified` ≤ `lmtNum` always; equals `lmtNum` unless candidate pool underflows (rare ccy / strict tier combos). Default 100; values above ~1500 add latency without benefit (exceeds typical candidate pool size). |

### `smartmoney_get_signal_trend_by_trader` · read-only
Time-series of single-asset smart-money signal aggregated over a hand-picked set of traders (`authorIds`). Returns the latest `limit` buckets ending at `asOfTime` (defaults to current UTC hour). Capability tier filters (pnlTier / winRateTier / etc.) not exposed - backend uses defaults for direct-lookup scenarios. **Linear (USDT/USDS-margined) contracts only - a trader's coin-margined (`-USD-SWAP` / `-USD-DELIVERY`) positions on the requested base ccy are silently excluded from each bucket.** Use `smartmoney_get_trader_positions` to inspect the full position book. Use when: tracking how a specific group of traders has evolved their long/short consensus over time on one coin. See also: `smartmoney_get_signal_trend_by_filter` (criteria-defined pool), `smartmoney_get_signal_overview_by_trader` (latest snapshot only), `smartmoney_get_traders_by_filter` / `smartmoney_search_trader` (discover authorIds). Note: `asOfTime` is 10-digit `yyyyMMddHH` UTC, different from leaderboard tools' 12-digit UTC+8 `updateTime` - do not cross-pass.

| param | type | req | description |
|---|---|---|---|
| authorIds | array | ✓ | Trader IDs to aggregate over, e.g. `["1001", "1002"]`. Required. |
| instCcy | string | ✓ | Base currency to scope the time-series, e.g. "BTC". Required. Scope: USDT-margined and USDS-margined (linear) instruments only - coin-margined (`-USD-SWAP` / `-USD-DELIVERY`) positions held by the trader set are NOT included. |
| asOfTime | string |  | Anchor snapshot time - 10-digit `yyyyMMddHH` UTC as a string, e.g. `"2026050100"`. Returns the latest `limit` buckets ending at this anchor. Omit to use the current UTC hour. |
| granularity | 1h\|1d | ✓ | Time-bucket size. `1h` = hourly snapshots (intraday/short-term trend), `1d` = daily snapshots (multi-day trend). |
| limit | integer |  | Number of buckets to return (newest first), ending at `asOfTime`. Default 24, max 500. |
| sortBy | pnl\|pnlRatio | ✓ | Required. Ranking key for the trader set. `pnl` = absolute USD profit; `pnlRatio` = percentage return. Default `"pnl"`. |
| period | 3\|7\|30\|90 | ✓ | Required. Lookback window in days. One of `"3"` / `"7"` / `"30"` / `"90"`. Default `"7"`. Does NOT affect signal fields (which always use the latest snapshot). |

## trade (1)

### `trade_get_history` · read-only
Query local audit log of tool calls made through this MCP server. Returns recent operations with timestamps, duration, params, and results. Use to review what trades or queries were executed in this session or past sessions.

| param | type | req | description |
|---|---|---|---|
| limit | number |  | Max results (default 20) |
| tool | string |  | e.g. swap_place_order |
| level | INFO\|WARN\|ERROR\|DEBUG |  |  |
| since | string |  | ISO 8601 timestamp lower bound |

## skills (3)

### `skills_get_categories` · read-only
List all available skill categories in OKX Skills Marketplace. Use the returned categoryId as input to skills_search for category filtering. Do NOT use for searching or downloading skills - use skills_search or skills_download.

### `skills_search` · read-only
Search for skills in OKX Skills Marketplace by keyword or category. To get valid category IDs, call skills_get_categories first. Returns skill names for use with skills_download. Do NOT use for downloading - use skills_download.

| param | type | req | description |
|---|---|---|---|
| keyword | string |  | Search keyword (matches name, description, tags) |
| categories | string |  | Filter by category ID |
| page | string |  | Page number, starting from 1. Default: 1 |
| limit | string |  | Results per page. Default: 20, max: 100 |

### `skills_download` · WRITE
Download a skill package from OKX Skills Marketplace to a local directory. Always call skills_search first to confirm the skill name exists. Downloads the latest approved version. NOTE: Downloads third-party developer content - does NOT install to agents. For full installation use CLI: okx skill add <name>. Use when the user wants to inspect or manually install a skill package.

| param | type | req | description |
|---|---|---|---|
| name | string | ✓ | Skill name (unique identifier) |
| targetDir | string | ✓ | Directory path where the file will be saved |
| format | zip\|skill |  | Output file format: 'zip' or 'skill' (default: 'skill') |

## system (1)

### `system_get_capabilities` · read-only
Return machine-readable server capabilities and module availability for agent planning.

