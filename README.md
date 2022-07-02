### K6 Test

---

## Running local tests

> k6 run script.js

## Adding more VUs

> k6 run --vus 10 --duration 30s script.js

 - `--vus` : 10 virtual user
 - `--duration 30s` : running a 30 second

VUs are essentially parallel while(true) loops

## Demo

```
          /\      |‾‾| /‾‾/   /‾‾/
     /\  /  \     |  |/  /   /  /
    /  \/    \    |     (   /   ‾‾\
   /          \   |  |\  \ |  (‾)  |
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: script.js
     output: -

  scenarios: (100.00%) 1 scenario, 10 max VUs, 1m0s max duration (incl. graceful stop):
           * default: 10 looping VUs for 30s (gracefulStop: 30s)


running (0m31.2s), 00/10 VUs, 252 complete and 0 interrupted iterations
default ✓ [======================================] 10 VUs  30s
     http_req_failed................: 0.00%  ✓ 0        ✗ 252
     http_req_receiving.............: avg=183.45µs min=0s       med=0s       max=1.18ms   p(90)=983.45µs p(95)=1ms
     http_req_sending...............: avg=25.5µs   min=0s       med=0s       max=2.62ms   p(90)=0s       p(95)=0s
     http_req_tls_handshaking.......: avg=7.93ms   min=0s       med=0s       max=205.08ms p(90)=0s       p(95)=0s
     http_req_waiting...............: avg=176.61ms min=158.55ms med=176.25ms max=303.23ms p(90)=186.12ms p(95)=189.75ms
     http_reqs......................: 252    8.088321/s
     iteration_duration.............: avg=1.2s     min=1.16s    med=1.18s    max=1.83s    p(90)=1.19s    p(95)=1.21s
     iterations.....................: 252    8.088321/s
     vus............................: 2      min=2      max=10
     vus_max........................: 10     min=10     max=10
```

## Options

```javascript
import http from 'k6/http';
import { sleep } from 'k6';
export const options = {
  vus: 10,
  duration: '30s',
};
export default function () {
  http.get('http://test.k6.io');
  sleep(1);
}
```

> instead of : --vus 10 and --duration 30s

## Ramping

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m30s', target: 10 },
    { duration: '20s', target: 0 },
  ],
};
```

## Distributed

```
kubectl apply -f /path/k6-resource.yaml
```

```yml
apiVersion: k6.io/v1alpha1
kind: K6
metadata:
  name: k6-sample
spec:
  parallelism: 4
  script:
    configMap:
      name: "k6-test"
      file: "script.js"
```

## Output

> Json

```
k6 run --out json=my_test_result.json script.js
```

> CSV

```
k6 run --out csv=my_test_result.gz script.js
```

## Url Grouping

```javascript
import http from 'k6/http';

export default function () {
  for (let id = 1; id <= 100; id++) {
    http.get(`http://example.com/posts/${id}`);
  }
}
```

```javascript
import http from 'k6/http';

export default function () {
  for (let id = 1; id <= 100; id++) {
    http.get(`http://example.com/posts/${id}`, {
      tags: { name: 'PostsItemURL' },
    });
  }
}
```

## Metrics

| Metric Name        | Type    | Description                                                                                                                                                                                                                                                   |
|--------------------|---------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| vus                | Gauge   | Current number of active virtual users                                                                                                                                                                                                                        |
| vus_max            | Gauge   | Max possible number of virtual users (VU resources are pre-allocated, ensuring performance will not be affected when scaling up the load level)                                                                                                              |
| iterations         | Counter | The aggregate number of times the VUs executed the JS script (the `default` function).                                                                                                                                                                        |
| iteration_duration | Trend   | The time it took to complete one full iteration, including time spent in `setup` and `teardown`. To calculate the duration of the iteration's function for the specific scenario, [try this workaround](/using-k6/workaround-to-calculate-iteration_duration) |
| dropped_iterations | Counter | The number of iterations that weren't started due to lack of VUs (for the arrival-rate executors) or lack of time (expired maxDuration in the iteration-based executors).                                                                             |
| data_received      | Counter | The amount of received data. [This example covers how to track data for an individual URL](/examples/track-transmitted-data-per-url).                                                                                                                         |
| data_sent          | Counter | The amount of data sent. [Track data for an individual URL](/examples/track-transmitted-data-per-url) to track data for an individual URL.                                                                                                                                   |
| checks             | Rate    | The rate of successful checks.                                                                                                                                                                                                                                |

## HTTP-specific built-in metrics

| Metric Name              | Type    | Description                                                                                                                                                                                                                                  |
|--------------------------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| http_reqs                | Counter | How many total HTTP requests k6 generated.                                                                                                                                                                                                   |
| http_req_blocked         | Trend   | Time spent blocked (waiting for a free TCP connection slot) before initiating the request. `float`                                                                                                                                           |
| http_req_connecting      | Trend   | Time spent establishing TCP connection to the remote host. `float`                                                                                                                                                                           |
| http_req_tls_handshaking | Trend   | Time spent handshaking TLS session with remote host                                                                                                                                                                                          |
| http_req_sending         | Trend   | Time spent sending data to the remote host. `float`                                                                                                                                                                                          |
| http_req_waiting         | Trend   | Time spent waiting for response from remote host (a.k.a. “time to first byte”, or “TTFB”). `float`                                                                                                                                           |
| http_req_receiving       | Trend   | Time spent receiving response data from the remote host. `float`                                                                                                                                                                             |
| http_req_duration        | Trend   | Total time for the request. It's equal to `http_req_sending + http_req_waiting + http_req_receiving` (i.e. how long did the remote server take to process the request and respond, without the initial DNS lookup/connection times). `float` |
| http_req_failed          | Rate    | The rate of failed requests according to [setResponseCallback](/javascript-api/k6-http/setresponsecallback).                                                                                                                        |
|                          |         |                                                                                                                                                                                                                                              |
