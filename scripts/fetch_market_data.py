import ccxt
import pandas as pd
import os

print("✅ Script is running...")

try:
    print("✅ Connecting to Kraken API...")
    exchange = ccxt.kraken()  # Switching to Kraken

    print("✅ Fetching BTC/USD historical data from Kraken...")
    ohlcv = exchange.fetch_ohlcv('BTC/USD', timeframe='1h', limit=100)

    print(f"✅ Successfully fetched {len(ohlcv)} data points!")

    # Convert to DataFrame
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')

    # Save to CSV inside the 'data' folder
    data_path = os.path.join(os.getcwd(), "data", "btc_usd_data.csv")
    print(f"✅ Saving data to {data_path}...")

    df.to_csv(data_path, index=False)

    if os.path.exists(data_path):
        print(f"🎉 Market data successfully saved to {data_path}!")
    else:
        print("❌ File not found after saving. Something went wrong.")

except Exception as e:
    print(f"❌ An error occurred: {e}")
