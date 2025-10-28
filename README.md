# Tessie Python API Wrapper
![Total downloads for the project](https://static.pepy.tech/badge/tessie-api) ![Last 30 days downloads for the project](https://static.pepy.tech/badge/tessie-api/month)


## Description
Tessie Python API Wrapper is a simple wrapper designed to interact with various APIs exposed by Tessie.

https://pypi.org/project/tessie-api/

## Getting Started

### Prerequisites
Before you begin, ensure you have met the following requirements:
- Python version >=3.5

### Installation
To install Tessie Python API Wrapper, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/andrewgierens/sems_portal_api.git
   ```

2. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

### Usage
To use Tessie Python API Wrapper, you need to have Python and `aiohttp` installed. Here’s a quick example to get you started:

```python
import asyncio
from tessie_api import get_state_of_all_vehicles

async def main():
    async with aiohttp.ClientSession() as session:  # ClientSession is created here and will be closed when exiting the block
        data = await get_state_of_all_vehicles(session=session, api_key="TESSIE_KEY", only_active=True)
        print(data)

if __name__ == "__main__":
    asyncio.run(main())
```

### Generating JWT tokens for the Cloudflare Worker
The Cloudflare Worker included in this repository expects incoming requests to provide a bearer token signed with the shared secret defined in the `JWT_SECRET` environment variable. Configure the secret in Wrangler with `wrangler secret put JWT_SECRET`, then choose one of the following approaches to create tokens during development:

#### 1. Use the built-in helper module
Run the helper directly with Python (it will automatically read `JWT_SECRET` if it is set):

```bash
python -m tessie_api.jwt_utils --subject my-service --expires-in 900
```

You can override or extend claims by passing `--claim KEY=VALUE` flags. Values are parsed as JSON whenever possible, so strings must be quoted (for example, `--claim roles='["admin"]'`).

#### 2. Manually create a token with PyJWT
If you prefer to generate tokens by hand, `PyJWT` is included in the dependencies:

```bash
python - <<'PY'
import datetime as dt
import jwt

secret = "your-shared-secret"  # must match the JWT_SECRET configured in the worker
payload = {
    "sub": "my-service",           # subject identifier for the caller
    "iat": dt.datetime.utcnow(),    # issued-at timestamp
    "exp": dt.datetime.utcnow() + dt.timedelta(minutes=30),  # expiry time
}

token = jwt.encode(payload, secret, algorithm="HS256")
print(token)
PY
```

Use the printed token as a bearer token when calling the worker:

```bash
curl -H "Authorization: Bearer <token>" https://your-worker.workers.dev/status?vin=...
```

### Offline development helpers
For local testing you can opt into deterministic fake Tessie API responses by setting `TESSIE_USE_FAKE_RESPONSES=1`. The fake responses honour the `TESLA_VIN` environment variable (defaulting to `TESTVIN1234567890`) so you can write assertions without contacting the real Tessie service.

## Tests
```bash
pip install -e .
pytest
```

## Contributing
Contributions to Tessie Python API Wrapper are welcome and appreciated. If you have any suggestions or bug reports, please open an issue in the repository.
[creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## License
This project is licensed under the GNU GPLv3 License - see the [LICENSE.md](LICENSE.md) file for details.

## Contributors
<!-- readme: contributors -start -->
<table>
<tr>
    <td align="center">
        <a href="https://github.com/andrewgierens">
            <img src="https://avatars.githubusercontent.com/u/4150500?v=4" width="100;" alt="andrewgierens"/>
            <br />
            <sub><b>Andrew Gierens</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/Bre77">
            <img src="https://avatars.githubusercontent.com/u/2647914?v=4" width="100;" alt="Bre77"/>
            <br />
            <sub><b>Brett Adams</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/KrzysztofHajdamowicz">
            <img src="https://avatars.githubusercontent.com/u/24268470?v=4" width="100;" alt="KrzysztofHajdamowicz"/>
            <br />
            <sub><b>KrzysztofHajdamowicz</b></sub>
        </a>
    </td>
    <td align="center">
        <a href="https://github.com/atinsley">
            <img src="https://avatars.githubusercontent.com/u/6677642?v=4" width="100;" alt="atinsley"/>
            <br />
            <sub><b>Null</b></sub>
        </a>
    </td></tr>
</table>
<!-- readme: contributors -end -->
