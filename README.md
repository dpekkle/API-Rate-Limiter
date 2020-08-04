A simple node express implementation of an API Rate Limiter. 

See here for more information on rate limiting, and different strategies that can be employed:
https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm/

Rate limiting algorithms are:
- Sliding Log
- Fixed Window

There is room to easily extend the implementation to use different strategies.

The core of this code is a number of exported classes:
- FixedWindowRateLimiter
- SlidingLogRateLimiter
and a base class
- RateLimiter 

A local host demonstration of these classes being used can be explored via cloning the code, running npm install, then npm start.

The demo includes endpoints
- /fixed - limited to 100 requests from the time X:00 to X+1:00
- /sharedFixed - limited to the same 100 requests that /fixed uses
- /sliding - a separate limit of 100 requests, using Sliding Log.
