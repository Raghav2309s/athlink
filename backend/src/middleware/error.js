'use strict';

function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.statusCode || 500;

  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message:
        status === 500
          ? 'Internal server error'
          : err.message,
    },
  });
}

module.exports = {
  errorHandler,
};