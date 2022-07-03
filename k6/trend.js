import { Trend } from "k6/metrics";
import http from "k6/http";

var myTrend = new Trend("my_trend");

export const options = {
  stages: [
    { duration: "5s", target: 10 },
    { duration: "6s", target: 10 },
    { duration: "2s", target: 5 },
  ],
};

export default function () {
  let res = http.get("https://test.k6.io");
  myTrend.add(res.timings.sending + res.timings.receiving);
}
