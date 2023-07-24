import { URL } from "url";

let str = "";
export const resolve = async (specifier, context, defaultResolve) => {
  const result = await defaultResolve(specifier, context, defaultResolve);

  const child = new URL(result.url);

  if (!child.pathname.startsWith("/home/prater/Projects/AnonEventBot/commands"))
    return result;

  return {
    url: child.href + "?id=" + Math.random().toString(36).substring(3),
  };
};
