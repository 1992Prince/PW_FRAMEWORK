// src/tests/api-demo.spec.js
//
// Demo test showcasing the Fluent Interface pattern via ApiRequestBuilder.
// All method calls (get, post, withHeader, withBody) are synchronous and chainable.
// Only the final .send() is async — one await at the very end.

import { test, expect } from "@playwright/test";
import { ApiRequestBuilder } from "../utils/ApiRequestBuilder.js";

const BASE_URL = "https://api.restful-api.dev/objects";

test("GET all objects — fluent chain demo", async ({ request }) => {
  const response = await new ApiRequestBuilder(request)
    .get(BASE_URL)
    .withHeaders({ Accept: "application/json" })
    .send();

  expect(response.status()).toBe(200);

  const body = await response.json();
  console.log("GET response — first object:", body[0]);

  expect(Array.isArray(body)).toBeTruthy();
  expect(body.length).toBeGreaterThan(0);
});

test("POST new object — fluent chain demo", async ({ request }) => {
  const response = await new ApiRequestBuilder(request)
    .post(BASE_URL)
    .withHeaders({ Accept: "application/json", "Content-Type": "application/json" })
    .withBody({ name: "Demo Laptop", data: { year: 2024, price: 1500, CPU_model: "Intel Core i9" } })
    .send();

  expect(response.status()).toBe(200);

  const body = await response.json();
  console.log("POST response — created object:", body);

  expect(body).toHaveProperty("id");
  expect(body.name).toBe("Demo Laptop");
});
