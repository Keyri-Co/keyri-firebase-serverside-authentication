export const errorsList = {
  error1000: {
    message: 'The next error was caught: ',
    code: 1000,
    status: 500
  },
  error1001: {
    message: 'Missing data',
    code: 1001,
    status: 400
  },
  error1002: {
    message: 'User not found',
    code: 1002,
    status: 404,
  },
  error1003: {
    message: 'Signature is not verified',
    code: 1003,
    status: 403,
  }
};

export class KeyriError extends Error {
  code;
  error;

  constructor(code, descriptionMessage) {
    super();
    this.code = code;
    if (errorsList[`error${code}`]) {
      const errorObject = errorsList[`error${code}`];
      this.error = { ...errorObject };
      this.error.message = descriptionMessage ? `${errorObject.message} ${descriptionMessage}` : errorObject.message;
    } else {
      this.error = {...errorsList.error1000};
    }
  }
}

export function handleServerError(err, res) {
  console.log(`keyriError: ${err.message}`);
  if (err instanceof KeyriError) {
    return res.status(err.error.status).send(err.error.message);
  }
  return res.status(500).send(err.message);
}
