import { Counter } from "k6/metrics";
import http from "k6/http";

var myErrorCounter = new Counter("my_error_counter");

export const options = {
  stages: [
    { duration: "5s", target: 10 },
    { duration: "6s", target: 10 },
    { duration: "2s", target: 5 },
  ],
};

export default function () {
  let res = http.get("https://test.k6.io/404");
  if (res.status === 404) {
    myErrorCounter.add(1);
  }
}
