# Backend API Documentation

## Introduction
Welcome to the backend API documentation. This API provides endpoints for managing prices, models, and predictions. It is designed to support the frontend dashboard and other integrations.

### Base URL
The base URL for all endpoints is:
```
http://localhost:5000/api
```

### Authentication
Currently, no authentication is required. Future versions may include token-based authentication.

---

## Endpoints

### Price Routes

#### GET `/api/prices/summary`
Fetch a summary for a given symbol, including current price and 24h change.

- Query Parameters:
  - `symbol` (optional, default: `BTC`)

- Example Response:
```json
{
  "data": {
    "symbol": "BTC",
    "currentPrice": 27000.5,
    "ts": 1695739200000,
    "lastClose": 26950.0,
    "change24hAbs": 50.5,
    "change24hPct": 0.00187
  }
}
```

#### GET `/api/prices/latest`
Fetch the latest price for a given symbol.

- **Query Parameters:**
  - `symbol` (optional, default: `BTC`): The symbol to fetch the latest price for.

- **Example Request:**
```bash
curl -X GET "http://localhost:5000/api/prices/latest?symbol=BTC"
```

- **Example Response:**
```json
{
  "data": {
    "symbol": "BTC",
    "source": "coingecko",
    "price": 27000.5,
    "ts": 1695739200000
  }
}
```

#### GET `/api/prices/history`
Fetch historical price data for a given symbol.

- **Query Parameters:**
  - `symbol` (optional, default: `BTC`): The symbol to fetch history for.
  - `from` (optional): Start timestamp (in milliseconds).
  - `to` (optional): End timestamp (in milliseconds).
  - `limit` (optional, default: 500): Maximum number of records to return.

- **Example Request:**
```bash
curl -X GET "http://localhost:5000/api/prices/history?symbol=BTC&from=1695735600000&to=1695739200000"
```

- **Example Response:**
```json
{
  "data": [
    { "price": 27000.5, "ts": 1695739200000, "source": "coingecko" },
    { "price": 26950.0, "ts": 1695735600000, "source": "coingecko" }
  ]
}
```

---

### Model Routes

#### POST `/api/models`
Create a new model.

- **Request Body:**
```json
{
  "id": "model_1",
  "name": "Primary Model",
  "description": "A model for BTC price prediction",
  "version": "1.0"
}
```

- **Example Request:**
```bash
curl -X POST "http://localhost:5000/api/models" \
-H "Content-Type: application/json" \
-d '{
  "id": "model_1",
  "name": "Primary Model",
  "description": "A model for BTC price prediction",
  "version": "1.0"
}'
```

- **Example Response:**
```json
{
  "message": "Model created successfully"
}
```

#### GET `/api/models`
List all models.

- **Example Request:**
```bash
curl -X GET "http://localhost:5000/api/models"
```

- **Example Response:**
```json
{
  "data": [
    {
      "id": "model_1",
      "name": "Primary Model",
      "description": "A model for BTC price prediction",
      "version": "1.0",
      "created_at": 1695739200000
    }
  ]
}
```

---

### Prediction Routes

#### GET `/api/predictions`
List predictions for a specific model. If the model is an EMA model (e.g., `ema_24h`), the server computes and stores a fresh prediction on demand before returning data.

- Query Parameters:
  - `modelId` (required): e.g., `ema_24h`
  - `symbol` (optional, default: `BTC`)

- Example Request:
```bash
curl -X GET "http://localhost:5000/api/predictions?modelId=ema_24h&symbol=BTC"
```

- Example Response:
```json
{
  "data": [
    {
      "model_id": "ema_24h",
      "symbol": "BTC",
      "predicted_price": 28000.0,
      "confidence": 0.82,
      "horizon": "1h",
      "ts": 1695739200000,
      "id": 12
    }
  ]
}
```

#### POST `/api/predictions`
Create a new prediction.

- **Request Body:**
```json
{
  "modelId": "model_1",
  "symbol": "BTC",
  "predictedPrice": 28000.0,
  "confidence": 0.95,
  "horizon": "1d"
}
```

- **Example Request:**
```bash
curl -X POST "http://localhost:5000/api/predictions" \
-H "Content-Type: application/json" \
-d '{
  "modelId": "model_1",
  "symbol": "BTC",
  "predictedPrice": 28000.0,
  "confidence": 0.95,
  "horizon": "1d"
}'
```

- **Example Response:**
```json
{
  "message": "Prediction created successfully"
}
```

#### GET `/api/predictions`
List predictions for a specific model.

- **Query Parameters:**
  - `modelId` (required): The ID of the model to fetch predictions for.

- **Example Request:**
```bash
curl -X GET "http://localhost:5000/api/predictions?modelId=model_1"
```

- **Example Response:**
```json
{
  "data": [
    {
      "model_id": "model_1",
      "symbol": "BTC",
      "predicted_price": 28000.0,
      "confidence": 0.95,
      "horizon": "1d",
      "ts": 1695739200000
    }
  ]
}
```

---

## Error Handling

### Common Error Codes
- **400 Bad Request**: Invalid input or missing required parameters.
- **404 Not Found**: Resource not found.
- **500 Internal Server Error**: Unexpected server error.

---

## Health Check

### GET `/api/health`
Check the health of the API.

- **Example Request:**
```bash
curl -X GET "http://localhost:5000/api/health"
```

- **Example Response:**
```json
{
  "ok": true,
  "service": "price-proxy"
}
```
