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

## Environment Variables

With the --env flag, you can use the CLI to define k6 variables. Then, you can use the variable to dynamically define an option's value in the script file.

his flag just provides variables to the script, which the script can use or ignore. For example, -e K6_ITERATIONS=120 does not configure the script iterations.

> k6 run script.js --env MY_USER_AGENT="hello"

```javascript
import http from "k6/http";

export const options = {
  userAgent: __ENV.MY_USER_AGENT,
};

export default function () {
  http.get("http://test.k6.io/");
}
```

## Options

Options define test-run behavior. Most options can be passed in multiple places  
| Option | Description |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Address | Address of the REST API server |
| Batch | Max number of simultaneous connections of a `http.batch()` call |
| Batch per host | Max number of simultaneous connections of a `http.batch()` call for a host |
| Blacklist IP | Blacklist IP ranges from being called |
| Block hostnames | Block any requests to specific hostnames |
| Compatibility mode | Support running scripts with different ECMAScript modes |
| Config | Specify the config file in JSON format to read the options values |
| Console output | Redirects logs logged by `console` methods to the provided output file |
| Discard response bodies | Specify whether response bodies should be discarded |
| DNS | Configure DNS resolution behavior |
| Duration | A string specifying the total duration of the test run; together with the vus option, it's a shortcut for a single scenario with a constant VUs executor |
| Execution segment | Limit execution to a segment of the total test |
| Exit on running | Exits when test reaches the running status |
| Extension options | An object used to set configuration options for third-party collectors |
| Hosts | An object with overrides to DNS resolution |
| HTTP debug | Log all HTTP requests and responses |
| Include system Env vars | Pass the real system environment variables to the runtime |
| Insecure skip TLS verify | A boolean specifying whether should ignore TLS verifications for VU connections |
| Iterations | A number specifying a fixed number of iterations to execute of the script; together with the vus option, it's a shortcut for a single scenario with a shared iterations executor |
| Linger | A boolean specifying whether k6 should linger around after test run completion |
| Local IPs | A list of local IPs, IP ranges, and CIDRs from which VUs will make requests |
| Log output | Configuration about where logs from k6 should be send |
| LogFormat | Specify the format of the log output |
| Max redirects | The maximum number of HTTP redirects that k6 will follow |
| Minimum iteration duration | Specify the minimum duration for every single execution |
| No color | A boolean specifying whether colored output is disabled |
| No connection reuse | A boolean specifying whether k6 should disable keep-alive connections |
| No cookies reset | This disables resetting the cookie jar after each VU iteration |
| No summary | disables the end-of-test summary |
| No setup | A boolean specifying whether `setup()` function should be run |
| No teardown` function should be run | | No thresholds | Disables threshold execution | | No usage report | A boolean specifying whether k6 should send a usage report | | No VU connection reuse | A boolean specifying whether k6 should reuse TCP connections | | Paused | A boolean specifying whether the test should start in a paused state | | Quiet | A boolean specifying whether to show the progress update in the console or not | | Results output | Specify the results output | | RPS | | Scenarios | Define advanced execution scenarios | | Setup timeout` function is allow to run before it's terminated |
| Show logs | A boolean specifying whether the cloud logs are printed out to the terminal |
| Stages |
| Supply environment variable | Add/override environment variable with `VAR=value` |
| System tags | Specify which System Tags will be in the collected metrics |
| Summary export |
| Summary trend stats |
| Summary time unit |
| Tags | Specify tags that should be set test-wide across all metrics |
| Teardown timeout function is allowed to run before it's terminated |
| Thresholds | Configure under what conditions a test is successful or not |
| Throw | A boolean specifying whether to throw errors on failed HTTP requests |
| TLS auth | A list of TLS client certificate configuration objects |
| TLS cipher suites | A list of cipher suites allowed to be used by in SSL/TLS interactions with a server |
| TLS version | String or object representing the only SSL/TLS version allowed |
| User agent | A string specifying the User-Agent header when sending HTTP requests |
| Verbose | A boolean specifying whether verbose logging is enabled |
| VUs | A number specifying the number of VUs to run concurrently |

## Test life cycle

```javascript
// 1. init code

export function setup() {
  // 2. setup code
}

export default function (data) {
  // 3. VU code
}

export function teardown(data) {
  // 4. teardown code
}
```

| Test stage      | Used to                                                    | Example                                                                                 | Called                                                        | Required? |
| --------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------- | --------- |
| **1. init**     | Load local files, import modules, declare global variables | Open JSON file, Import module                                                           | Once per VU\*                                                 | Required  |
| **2. Setup**    | Set up data for processing, share data among VUs           | Call API to start test environment                                                      | Once                                                          | Optional  |
| **3. VU code**  | Run the test function, usually `default`                   | Make https requests, validate responses                                                 | Once per iteration, as many times as the test options require | Required  |
| **4. Teardown** | Process result of setup code, stop test environment        | Validate that setup had a certain result, send webhook notifying that test has finished | Once per script                                               | Optional  |

## Modules

> _utils_

```javascript
import { randomItem } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export default function () {
  randomItem();
}
```

The utils module contains number of small utility functions useful in every day load testing.

| Function                                                                            | Description                                                                                                                                                          |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| randomIntBetween(min, max)                                                          | Random integer in a given range                                                                                                                                      |
| randomItem(array)                                                                   | Random item from a given array                                                                                                                                       |
| randomString(length, charset)                                                       | Random string of a given length, optionally selected from a custom character set                                                                                     |
| uuidv4()                                                                            | Random UUID v4 in a string representation                                                                                                                            |
| findBetween(content, left, right, repeat)                                           | Extract a string between two surrounding strings                                                                                                                     |
| normalDistributionStages(maxVUs, durationSeconds, numberOfStages) of VUs for a test |
| getCurrentStageIndex                                                                | Get the index of the running stage as defined in the `stages` array options. It can be used only with the executors that support the `stages` option as ramping-vus. |
| tagWithCurrentStageIndex                                                            | Tag all the generated metrics in the iteration with the index of the current running stage.                                                                          |
| tagWithCurrentStageProfile                                                          | Tag all the generated metrics in the iteration with the computed profile for the current running stage.                                                              |

```javascript
import { sleep } from "k6";
import http from "k6/http";

import {
  randomIntBetween,
  randomString,
  randomItem,
  uuidv4,
  findBetween,
} from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

export default function () {
  const res = http.post(`https://test-api.k6.io/user/register/`, {
    first_name: randomItem(["Joe", "Jane"]), // random name
    last_name: `Jon${randomString(1, "aeiou")}s`, //random character from given list
    username: `user_${randomString(10)}@example.com`, // random email address,
    password: uuidv4(), // random password in form of uuid
  });

  // find a string between two strings to grab the username:
  const username = findBetween(res.body, '"username":"', '"');
  console.log("username from response: " + username);

  sleep(randomIntBetween(1, 5)); // sleep between 1 and 5 seconds.
}
```

> _httpx_

The httpx module is an external JavaScript library that wraps around the native k6/http module. It's a http client with features that are not yet available in the native module.

- bility to set http options globally (such as timeout)
- ability to set default tags and headers that will be used for all requests
- more user-friendly arguments to request functions (get, post, put take the same arguments)

| Function                           | Description                                                       |
| ---------------------------------- | ----------------------------------------------------------------- |
| request(method, url, body, params) | Generic method for making arbitrary HTTP requests.                |
| get(url, body, params)             | Makes GET request                                                 |
| post(url, body, params)            | Makes POST request                                                |
| put(url, body, params)             | Makes PUT request                                                 |
| patch(url, body, params)           | Makes PATCH request                                               |
| delete(url, body, params)          | Makes DELETE request                                              |
| batch(requests)                    | Batch multiple HTTP requests together, to issue them in parallel. |
| setBaseUrl(url)                    | Sets the base URL for the session                                 |
| addHeader(key, value)              | Adds a header to the session                                      |
| addHeaders(object)                 | Adds multiple headers to the session                              |
| clearHeader(name)                  | Removes header from the session                                   |
| addTag(key, value)                 | Adds a tag to the session                                         |
| addTags(object)                    | Adds multiple tags to the session                                 |
| clearTag(name)                     | Removes tag from the session                                      |

```javascript
import { fail } from "k6";
import { Httpx } from "https://jslib.k6.io/httpx/0.0.3/index.js";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.2.0/index.js";

const USERNAME = `user${randomIntBetween(1, 100000)}@example.com`; // random email address
const PASSWORD = "superCroc2021";

const session = new Httpx({
  baseURL: "https://test-api.k6.io",
  headers: {
    "User-Agent": "My custom user agent",
    "Content-Type": "application/x-www-form-urlencoded",
  },
  timeout: 20000, // 20s timeout.
});

export default function testSuite() {
  const registrationResp = session.post(`/user/register/`, {
    first_name: "Crocodile",
    last_name: "Owner",
    username: USERNAME,
    password: PASSWORD,
  });

  if (registrationResp.status !== 201) {
    fail("registration failed");
  }

  const loginResp = session.post(`/auth/token/login/`, {
    username: USERNAME,
    password: PASSWORD,
  });

  if (loginResp.status !== 200) {
    fail("Authentication failed");
  }

  const authToken = loginResp.json("access");

  // set the authorization header on the session for the subsequent requests.
  session.addHeader("Authorization", `Bearer ${authToken}`);

  const payload = {
    name: `Croc Name`,
    sex: "M",
    date_of_birth: "2019-01-01",
  };

  // this request uses the Authorization header set above.
  const respCreateCrocodile = session.post(`/my/crocodiles/`, payload);

  if (respCreateCrocodile.status !== 201) {
    fail("Crocodile creation failed");
  } else {
    console.log("New crocodile created");
  }
}
```

> _k6chaijs_

Chai Assertion Library is an assertion library that is paired with k6 to provide a more developer-friendly BDD and TDD assertion style. It's a more powerful alternative to the k6-native check() and group().

This library is recommended for any type of testing, but especially for:

- Functional testing, where many asserts are needed.
- Stress testing, where the System Under Test is failing and the test code needs to stay robust.
- Load testing, when the test should abort as soon as the first failure occurs.
- Unit testing of JavaScript code, which is not necessarily connected with load.
- JavaScript Developers, who are already familiar with Chai, Jest or Jasmine.

```javascript
import {
  describe,
  expect,
} from "https://jslib.k6.io/k6chaijs/4.3.4.1/index.js";
import http from "k6/http";

export const options = {
  thresholds: {
    checks: [{ threshold: "rate == 1.00" }], // fail test on any expect() failure
  },
};

export default function testSuite() {
  describe("Basic API test", () => {
    const response = http.get("https://test-api.k6.io/public/crocodiles");
    expect(response.status, "API status code").to.equal(200);
  });
}
```

```javascript
import http from "k6/http";
import {
  describe,
  expect,
} from "https://jslib.k6.io/k6chaijs/4.3.4.1/index.js";

export const options = {
  thresholds: {
    checks: [{ threshold: "rate == 1.00" }], // fail test on any expect() failure
  },
};

export default function testSuite() {
  describe("Fetch a list of public crocodiles", () => {
    const response = http.get("https://test-api.k6.io/public/crocodiles");

    expect(response.status, "response status").to.equal(200);
    expect(response).to.have.validJsonBody();
    expect(response.json().length, "number of crocs").to.be.above(4);
  });
}
```

[more info](https://www.chaijs.com/api/bdd/)

## Protocols

Out of the box, k6 supports the following protocols:

- HTTP/1.1
- HTTP/2
- WebSockets
- GRPC

xk6 is a separate CLI tool that lets you build custom k6 binaries. Community contributors have already added support for additional protocols, with extensions for SQL, Kafka, ZeroMQ, Redis

## Scenarios

Scenarios make in-depth configurations to how VUs and iterations are scheduled. This makes it possible to model diverse traffic patterns in load tests.

```javascript
export const options = {
  scenarios: {
    example_scenario: {
      // name of the executor to use
      executor: "shared-iterations",

      // common scenario configuration
      startTime: "10s",
      gracefulStop: "5s",
      env: { EXAMPLEVAR: "testing" },
      tags: { example_tag: "testing" },

      // executor-specific configuration
      vus: 10,
      iterations: 200,
      maxDuration: "10s",
    },
    another_scenario: {
      /*...*/
    },
  },
};
```

> Executors:

| Name                   | Value                   | Description                                                                                          |
| ---------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| Shared iterations      | `shared-iterations`     | A fixed amount of iterations are<br/> "shared" between a number of VUs.                              |
| Per VU iterations      | `per-vu-iterations`     | Each VU executes an exact number of iterations.                                                      |
| Constant VUs           | `constant-vus`          | A fixed number of VUs execute as many<br/> iterations as possible for a specified amount of time.    |
| Ramping VUs            | `ramping-vus`           | A variable number of VUs execute as many<br/> iterations as possible for a specified amount of time. |
| Constant Arrival Rate  | `constant-arrival-rate` | A fixed number of iterations are executed<br/> in a specified period of time.                        |
| Ramping Arrival Rate   | `ramping-arrival-rate`  | A variable number of iterations are <br/> executed in a specified period of time.                    |
| Externally Controlled. |
