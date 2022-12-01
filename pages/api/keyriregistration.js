import Cors from 'cors';

import { keyriRegister } from './utils/keyriFirebaseOps';
import { KeyriError } from './errorHandler';

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
  try {
    const { email, publicKey } = req.body;
    if (!email || !publicKey) {
      throw new KeyriError(1001);
    } else {
      const token = await keyriRegister(email, publicKey);
      return res.send(token);
    }
  } catch(err) {
    handleServerError(err, res);
  }
}
