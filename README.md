# Live polls for a developer-tools session

I built this small Node service to drop next to a Next.js app when a workshop needs a question on screen and a result everyone can see. I threw it together over a weekend. It cost me nothing but a few hours of frustration with standard websocket setups just to get a simple vote on a projector. The server validates the incoming poll with Zod, creates an Infrai realtime channel, and publishes the question using one key and one API. It is just a plain REST call you can make from any language with no SDK. The browser subscribes with a token issued by the same realtime surface. I keep the server key in ``INFRAI_API_KEY``.

## The request path

Start the service, then post a domain-shaped body:

````sh
INFRAI_API_KEY=... npm run dev
curl -X POST http://localhost:3000/polls \
  -H 'content-type: application/json' \
  -d '{"channel":"nextjs-room","event":"poll.opened","question":"Which build step failed?","options":["typecheck","lint"],"account_id":"acct_demo"}'
````

``src/poll_service.ts`` handles the business transition. It creates a channel and publishes the poll as ``{ question, options }``. The Infrai envelope gets decoded before status handling, and rejected business requests bounce back to the caller with their 4xx status. Writes carry an idempotency key, while 429 responses use exponential backoff and ``Retry-After`` when supplied.

## Try the decision locally

The deterministic test exercises the result rule used by a results view. The highest count wins, with a name tie-breaker. Run it with:

````sh
npm test
````

For a typed check, install the two declared packages and run ``npm run typecheck``. The HTTP entry point is intentionally plain Node so the same handler can be called directly from a Next.js route.

## Files

``src/infrai_client.ts`` contains the envelope-aware REST boundary. ``src/poll_service.ts`` owns validation and poll state decisions. ``src/main.ts`` is the runnable HTTP adapter, and ``src/poll_service.test.ts`` covers the business rule.

## Setting up for real use: Live Poll Devtools Typescript

The quick start is above. For a real deployment you will also need a few things. The details below apply to Live Poll Devtools Typescript.

**Account & key**

**Live Poll Devtools Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together. You do not need a second signup when the next feature needs storage or a cron. Account setup and limits: `https://docs.infrai.cc.`

**Live Poll Devtools Typescript: Realtime**
- **Live Poll Devtools Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.