import Cors from 'cors';

import { keyriRegister } from './utils/keyriFirebaseOps';

const cors = Cors({
  methods: ['POST', 'GET', 'HEAD'],
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  await runMiddleware(req, res, cors);
  const { email, publicKey } = req.body;
  if (typeof email === 'undefined' || typeof publicKey === 'undefined') {
    res.status(400).send('Missing data');
  } else {
    const token = await keyriRegister(email, publicKey);
    res.send(token);
  }
}
