// this is the number of requests allowed inflight at once. this is done to prevent
// the validation library from overwhelming our backend
import { createClientConcurrencyLimiter } from '@sanity/util/client';
var MAX_FETCH_CONCURRENCY = 10;
export var limitClientConcurrency = createClientConcurrencyLimiter(MAX_FETCH_CONCURRENCY);
