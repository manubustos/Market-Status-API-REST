import fetch from 'node-fetch';

export const getOrderBook = async (pairName: string, depth: number) => {
  const url = `https://api.bittrex.com/v3/markets/${pairName}/orderbook?depth=${depth}`;
  const res = await fetch(url, { method: 'GET', headers: { 'content-type': 'application/json' } });
  const response = await (res.json() as Promise<
    | {
        bid: { quantity: string; rate: string }[];
        ask: { quantity: string; rate: string }[];
      }
    | { code: string }
  >);
  if ('code' in response) {
    if (response.code === 'MARKET_DOES_NOT_EXIST') throw new Error('Pair name provided does not exist');
    throw new Error(response.code);
  }
  return response;
};

export const getEffectivePrice = async (
  pairName: string,
  type: 'buy' | 'sell',
  amount: number,
  priceLimit?: number,
  bigOperation = false
): Promise<{ fullyExecuted: boolean; effectivePrice: number; maxOrderSize: number }> => {
  const orderbook = (await getOrderBook(pairName, bigOperation ? 500 : 25))[type === 'buy' ? 'ask' : 'bid'];
  const totalAmount = orderbook.reduce((acc, val) => acc + Number(val.quantity), 0);
  if (amount < totalAmount && !bigOperation) {
    if (bigOperation) throw new Error('Amount bigger than Market Depth');
    else return getEffectivePrice(pairName, type, amount, priceLimit, true);
  }
  const { obtained, effectivePrice } = orderbook.reduce(
    (acc, { quantity, rate }) => {
      if (acc.left === 0) return acc;
      let orderAmount = Math.min(acc.left, Number(quantity));
      let orderSpent = Number(rate) * orderAmount;
      let newEffectivePrice = acc.effectivePrice + orderSpent / amount;

      // If the effective price exceds the price limit, then we calculate the new order amount
      if (priceLimit && newEffectivePrice > priceLimit) {
        orderAmount = (acc.spent - priceLimit * acc.obtained) / (priceLimit - Number(rate));
        orderSpent = Number(rate) * orderAmount;
        newEffectivePrice = priceLimit;
        acc.left = 0;
      } else {
        acc.left -= orderAmount;
      }

      acc.spent += orderSpent;
      acc.obtained += orderAmount;
      acc.effectivePrice = newEffectivePrice;

      return acc;
    },
    { spent: 0, obtained: 0, left: amount, effectivePrice: 0 }
  );
  const fullyExecuted = priceLimit ? obtained >= amount : true;
  const maxOrderSize = fullyExecuted ? amount : obtained;
  return { fullyExecuted, effectivePrice, maxOrderSize };
};
