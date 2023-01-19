import express from 'express';
import { json as jsonBodyParser, urlencoded } from 'body-parser';

import { getEffectivePrice, getOrderBook } from './bittrex';

const app = express();
app.disable('x-powered-by');
app.use(urlencoded({ extended: false }));
app.use(jsonBodyParser());

app.get(
  '/orderbook-tips/:pairName',
  async (request: express.Request, response: express.Response, next: express.NextFunction) => {
    try {
      const pairName = request.params['pairName'];
      if (!pairName) throw new Error('Pair name undefined');

      const { bid, ask } = await getOrderBook(pairName, 1);

      const topBid = bid[0];
      if (!topBid) throw new Error('There is no bid data');
      const topAsk = ask[0];
      if (!topAsk) throw new Error('There is no ask data');

      return response.json({ topBid, topAsk }).status(200);
    } catch (error) {
      return next(error);
    }
  }
);

app.get(
  '/effective-price/:pairName',
  async (request: express.Request, response: express.Response, next: express.NextFunction) => {
    try {
      const pairName = request.params['pairName'];
      if (!pairName) throw new Error('Pair name undefined');

      const { type, amount, priceLimit } = request.query;
      if (!type) throw new Error('Operation type undefined');
      if (!amount) throw new Error('Amount undefined');
      if (type !== 'buy' && type !== 'sell') throw new Error('Operation type invalid');
      if (Number.isNaN(Number(amount))) throw new Error('Amount invalid');

      const result = await getEffectivePrice(
        pairName,
        type,
        Number(amount),
        priceLimit ? Number(priceLimit) : undefined
      );

      return response.json(result).status(200);
    } catch (error) {
      return next(error);
    }
  }
);

// Error handling
app.use((error: string | Error, _: express.Request, response: express.Response) => {
  try {
    response.status(500).json({ message: error instanceof Error ? error.message : error });
  } catch (error) {
    response.end();
  }
});

app.use((_: express.Request, response: express.Response) => response.sendStatus(404).end());

app.listen(8888, () => console.log('Authentication server running at port 8888'));
