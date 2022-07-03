import { Rate } from "k6/metrics";
import http from "k6/http";

var myRate = new Rate("my_rate");

export const options = {
  stages: [
    { duration: "5s", target: 10 },
    { duration: "6s", target: 10 },
    { duration: "2s", target: 5 },
  ],
};

export default function () {
  let res = http.get("https://test.k6.io/404");
  myRate.add(res.error_code);
}
