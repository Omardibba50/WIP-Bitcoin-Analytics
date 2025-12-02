export function success(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: Date.now(),
      ...meta,
    },
  };
}

export function failure(message, status = 500, extra = {}) {
  return {
    success: false,
    error: {
      message,
      status,
      ...extra,
    },
    meta: {
      timestamp: Date.now(),
    },
  };
}

export function wrapAsync(fn) {
  return async (req, res) => {
    const start = Date.now();
    try {
      const result = await fn(req, res);
      if (res.headersSent) return; // controller handled
      res.json(success(result, { duration: Date.now() - start }));
    } catch (err) {
      console.error('Controller error:', err);
      if (res.headersSent) return;
      res.status(500).json(failure(err.message || 'Internal server error', 500));
    }
  };
}