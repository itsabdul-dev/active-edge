import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchAddresses } from "./address-search.server";
export const addressSearchAvailable = createServerFn({ method: "GET" }).handler(() =>
  Boolean(process.env["GEOAPIFY_API_KEY"]),
);
export const findAddress = createServerFn({ method: "POST" })
  .validator(z.object({ query: z.string().trim().min(4).max(200) }).strict())
  .handler(({ data }) => searchAddresses(data.query));
