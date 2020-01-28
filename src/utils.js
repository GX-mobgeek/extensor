import Debug from "debug";

export const debug = Debug("extensor");

export function isClient(target) {
  return "io" in target;
}

export const slugify = str => str.replace(/ /g, "").toLowerCase();
