## Rule-Validation API

##### Emmanuel Segun-Lean - @LeanKhan

#### Live: https://flw-rule-validation.herokuapp.com/

#### Endpoints:

## GET /

Returns the coder's profile

Response:

```json
{
  "message": "My Rule-Validation API.",
  "status": "success",
  "data": {
    "name": "Emmanuel Segun-Lean",
    "github": "@LeanKhan",
    "email": "eslean20@gmail.com",
    "mobile": "08140760114",
    "twitter": "@LeanKhan_"
  }
}
```

### POST /validate-rule

Validate Rule

**Example Request:**

```json
{
  "rule": {
    "field": "missions.count",
    "condition": "gte",
    "condition_value": 30
  },
  "data": {
    "name": "James Holden",
    "crew": "Rocinante",
    "age": 34,
    "position": "Captain",
    "missions": {
      "count": 45,
      "successful": 44,
      "failed": 1
    }
  }
}
```

**Example Response:**

```json
{
  "message": "field missions.count successfully validated.",
  "status": "success",
  "data": {
    "validation": {
      "error": false,
      "field": "missions.count",
      "field_value": 45,
      "condition": "gte",
      "condition_value": 30
    }
  }
}
```

## Tests

![Test Results](https://i.ibb.co/FK5MTWY/Tests-Results.png)

## Full API Documentation Here

https://documenter.getpostman.com/view/7313586/TW6zF6VA
