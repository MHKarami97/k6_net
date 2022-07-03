import http from "k6/http";
import { check } from "k6";
import {
  jUnit,
  textSummary,
} from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "20s", target: 10 },
    { duration: "10s", target: 5 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<250"],
  },
};

// export let options = {
//   test_1: {
//     executor: "constant-arrival-rate",
//     rate: 90,
//     timeUnit: "1m",
//     duration: "5m",
//     preAllocatedVUs: 10,
//     tags: { test_type: "api" },
//     env: { API_PROTOCOL: "http" },
//     exec: "api",
//   },
//   test_2: {
//     executor: "ramping-arrival-rate",
//     stages: [
//       { duration: "30s", target: 600 },
//       { duration: "6m30s", target: 200 },
//       { duration: "90s", target: 15 },
//     ],
//     startTime: "90s",
//     startRate: 15,
//     timeUnit: "10s",
//     preAllocatedVUs: 50,
//     maxVUs: 1000,
//     tags: { test_type: "api" },
//     env: { API_PROTOCOL: "https" },
//     exec: "api",
//   },
// };

export default function () {
  let res = http.get(`https://test.k6.io`);
  check(res, {
    "is status 200": (r) => r.status === 200,
  });
}

export function handleSummary(data) {
  let filepath = `./file-result.xml`;
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "./loadtest-results.xml": jUnit(data),
  };
}
