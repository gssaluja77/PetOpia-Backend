const badRequestError = (message) => {
  return { code: 400, message };
};

const internalServerError = (message) => {
  return { code: 500, message };
};

const notFoundError = (message) => {
  return { code: 404, message };
};

const unauthorizedError = (message) => {
  return { code: 403, message };
};

export {
  badRequestError,
  internalServerError,
  notFoundError,
  unauthorizedError,
};
