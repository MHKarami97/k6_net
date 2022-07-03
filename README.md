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
import http from "k6/http";
import { sleep } from "k6";
export const options = {
  vus: 10,
  duration: "30s",
};
export default function () {
  http.get("http://test.k6.io");
  sleep(1);
}
```

> instead of : --vus 10 and --duration 30s

## Ramping

```javascript
export const options = {
  stages: [
    { duration: "30s", target: 20 },
    { duration: "1m30s", target: 10 },
    { duration: "20s", target: 0 },
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

## Group

For extra organization, you can use groups to organize a load script by functions.

All metrics emitted in a group have the tag group with a value of all wrapping group names separated by ::

If you have a single group named cool requests, the actual value of the group is ::cool requests

For each group() function, k6 emits a group_duration metric, which contains the total time to execute the group function.

When a taggable resource—a check, request, or custom metric—runs within a group, k6 sets the tag group with the current group name

```javascript
import { group } from "k6";

export default function () {
  group("visit product listing page", function () {
    // ...
  });
  group("add several products to the shopping cart", function () {
    // ...
  });
  group("visit login page", function () {
    // ...
  });
  group("authenticate", function () {
    // ...
  });
  group("checkout process", function () {
    // ...
  });
}
```

## Tags

Tags are a powerful way to categorize your k6 entities and filter test results.

- System tags are tags that k6 automatically assigns.
- User-defined tags are tags that you add when you write your script.

System tags:

| Tag                 | Description                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `proto`             | the name of the protocol used (e.g. `HTTP/1.1`)                                                       |
| `subproto`          | the subprotocol name (used by websockets)                                                             |
| `status`            | the HTTP status code (e.g. `200`, `404`, etc.)                                                        |
| `method`            | the HTTP method name (e.g. `GET`, `POST`, etc.) or the RPC method name for gRPC                       |
| `url`               | the HTTP request URL                                                                                  |
| `name`              | the HTTP request name                                                                                 |
| `group`             | the full group path, see the preceding explanation for details about its value                        |
| `check`             | the Check name                                                                                        |
| `error`             | a string with a non-HTTP error message (e.g. network or DNS error)                                    |
| `error_code`        | A number specifying an error types; a list of current error codes can be found at the Error Codespage |
| `tls_version`       | the TLS version                                                                                       |
| `scenario`          | the name of the scenario where the metric was emitted                                                 |
| `service`           | the RPC service name for gRPC                                                                         |
| `expected_response` | `true` or `false` based on the responseCallback; by default checks whether the status is 2xx or 3xx   |

| Tag           | Description                                               |
| ------------- | --------------------------------------------------------- |
| `vu`          | the ID of the virtual user that executed the request      |
| `iter`        | the iteration number                                      |
| `ip`          | The IP address of the remote server                       |
| `ocsp_status` | the [Online Certificate Status Protocol OCSP HTTPS status |

```javascript
import http from "k6/http";
import { Trend } from "k6/metrics";
import { check } from "k6";

const myTrend = new Trend("my_trend");

export default function () {
  // Add tag to request metric data
  const res = http.get("http://httpbin.test.k6.io/", {
    tags: {
      my_tag: "I'm a tag",
    },
  });

  // Add tag to check
  check(
    res,
    { "status is 200": (r) => r.status === 200 },
    { my_tag: "I'm a tag" }
  );

  // Add tag to custom metric
  myTrend.add(res.timings.connecting, { my_tag: "I'm a tag" });
}
```

```javascript
import http from "k6/http";
import exec from "k6/execution";
import { tagWithCurrentStageProfile } from "https://jslib.k6.io/k6-utils/1.3.0/index.js";

export const options = {
  stages: [{ target: 10, duration: "10s" }],
};

export default function () {
  tagWithCurrentStageProfile();

  // all the requests are tagged with a `stage` tag
  // with the index of the stage as value
  http.get("https://test.k6.io"); // {stage_profile: ramp-up}
}
```

## Url Grouping

```javascript
import http from "k6/http";

export default function () {
  for (let id = 1; id <= 100; id++) {
    http.get(`http://example.com/posts/${id}`);
  }
}
```

```javascript
import http from "k6/http";

export default function () {
  for (let id = 1; id <= 100; id++) {
    http.get(`http://example.com/posts/${id}`, {
      tags: { name: "PostsItemURL" },
    });
  }
}
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

## Metrics

| Metric Name        | Type    | Description                                                                                                                                                                                           |
| ------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vus                | Gauge   | Current number of active virtual users                                                                                                                                                                |
| vus_max            | Gauge   | Max possible number of virtual users (VU resources are pre-allocated, ensuring performance will not be affected when scaling up the load level)                                                       |
| iterations         | Counter | The aggregate number of times the VUs executed the JS script (the `default` function).                                                                                                                |
| iteration_duration | Trend   | The time it took to complete one full iteration, including time spent in `setup` and `teardown`. To calculate the duration of the iteration's function for the specific scenario, try this workaround |
| dropped_iterations | Counter | The number of iterations that weren't started due to lack of VUs (for the arrival-rate executors) or lack of time (expired maxDuration in the iteration-based executors).                             |
| data_received      | Counter | The amount of received data. This example covers how to track data for an individual URL.                                                                                                             |
| data_sent          | Counter | The amount of data sent. Track data for an individual URL to track data for an individual URL.                                                                                                        |
| checks             | Rate    | The rate of successful checks.                                                                                                                                                                        |

## HTTP-specific built-in metrics

| Metric Name              | Type    | Description                                                                                                                                                                                                                                  |
| ------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| http_reqs                | Counter | How many total HTTP requests k6 generated.                                                                                                                                                                                                   |
| http_req_blocked         | Trend   | Time spent blocked (waiting for a free TCP connection slot) before initiating the request. `float`                                                                                                                                           |
| http_req_connecting      | Trend   | Time spent establishing TCP connection to the remote host. `float`                                                                                                                                                                           |
| http_req_tls_handshaking | Trend   | Time spent handshaking TLS session with remote host                                                                                                                                                                                          |
| http_req_sending         | Trend   | Time spent sending data to the remote host. `float`                                                                                                                                                                                          |
| http_req_waiting         | Trend   | Time spent waiting for response from remote host (a.k.a. “time to first byte”, or “TTFB”). `float`                                                                                                                                           |
| http_req_receiving       | Trend   | Time spent receiving response data from the remote host. `float`                                                                                                                                                                             |
| http_req_duration        | Trend   | Total time for the request. It's equal to `http_req_sending + http_req_waiting + http_req_receiving` (i.e. how long did the remote server take to process the request and respond, without the initial DNS lookup/connection times). `float` |
| http_req_failed          | Rate    | The rate of failed requests according to setResponseCallback.                                                                                                                                                                                |
|                          |         |                                                                                                                                                                                                                                              |

## Check

Checks are like assertions, but they don't halt execution. Instead, they store the result of the check, pass or fail, and let the script continue. If you want to halt execution, take a look at thresholds

When a check fails, the script will continue executing successfully and will not return a 'failed' exit status. If you need the whole test to fail based on the results of a check, you have to combine checks with thresholds.

```javascript
import { check } from "k6";
import http from "k6/http";

export default function () {
  const res = http.get("http://test.k6.io/");
  check(res, {
    "is status 200": (r) => r.status === 200,
  });
}
```

```javascript
import { check } from "k6";
import http from "k6/http";

export default function () {
  const res = http.get("http://test.k6.io/");
  check(res, {
    "verify homepage text": (r) =>
      r.body.includes(
        "Collection of simple web-pages suitable for load testing"
      ),
  });
}
```

```javascript
import { check } from "k6";
import http from "k6/http";

export default function () {
  const res = http.get("http://test.k6.io/");
  check(res, {
    "is status 200": (r) => r.status === 200,
    "body size is 11,105 bytes": (r) => r.body.length == 11105,
  });
}
```

## Thresholds

Thresholds are pass/fail criteria that specify the performance expectations of the system under test

For example, you can use thresholds to test that your system meets the following expectations:

- Less than 1% of requests return an error.
- 95% of requests have a response time below 200ms.
- 99% of requests have a response time below 400ms.
- A specific endpoint always responds within 300ms.
- Any conditions for a custom metric.

```javascript
import http from "k6/http";

export const options = {
  thresholds: {
    http_req_failed: ["rate<0.01"], // http errors should be less than 1%
    http_req_duration: ["p(95)<200"], // 95% of requests should be below 200ms
  },
};

export default function () {
  http.get("https://test-api.k6.io/public/crocodiles/1/");
}
```

```javascript
export const options = {
  thresholds: {
    // 90% of requests must finish within 400ms, 95% within 800, and 99.9% within 2s.
    http_req_duration: ["p(90) < 400", "p(95) < 800", "p(99.9) < 2000"],
  },
};
```

```javascript
import http from "k6/http";
import { group, sleep } from "k6";

export const options = {
  thresholds: {
    "group_duration{group:::individualRequests}": ["avg < 400"],
    "group_duration{group:::batchRequests}": ["avg < 200"],
  },
  vus: 1,
  duration: "10s",
};

export default function () {
  group("individualRequests", function () {
    http.get("https://test-api.k6.io/public/crocodiles/1/");
    http.get("https://test-api.k6.io/public/crocodiles/2/");
    http.get("https://test-api.k6.io/public/crocodiles/3/");
  });

  group("batchRequests", function () {
    http.batch([
      ["GET", `https://test-api.k6.io/public/crocodiles/1/`],
      ["GET", `https://test-api.k6.io/public/crocodiles/2/`],
      ["GET", `https://test-api.k6.io/public/crocodiles/3/`],
    ]);
  });

  sleep(1);
}
```

Aborting:

```javascript
import http from "k6/http";

export const options = {
  vus: 30,
  duration: "2m",
  thresholds: {
    http_req_duration: [
      {
        threshold: "p(99) < 10",
        abortOnFail: true,
        delayAbortEval: "10s",
      },
    ],
  },
};

export default function () {
  http.get("https://test-api.k6.io/public/crocodiles/1/");
}
```
