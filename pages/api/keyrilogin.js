import Cors from 'cors';

import { keyriLogin } from './utils/keyriFirebaseOps';
import { KeyriError } from './errorList';

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
    const { email, data, signature } = req.body;
    if (!user || !data || signature) {
      throw new KeyriError(1001);
    }
    const token = await keyriLogin(email, data, signature);
    return res.send(token);
  } catch (err) {
    handleServerError(err, res);
  }
}
