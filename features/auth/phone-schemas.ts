import { z } from "zod";
export const phoneSchema = z
  .string()
  .trim()
  .transform((value) => {
    let phone = value.replace(/[\s()-]/g, "");
    if (phone.startsWith("+63")) phone = phone.slice(3);
    else if (phone.startsWith("63") && phone.length === 12)
      phone = phone.slice(2);
    else if (phone.startsWith("0") && phone.length === 11)
      phone = phone.slice(1);
    return phone;
  })
  .refine(
    (value) => /^9[0-9]{9}$/.test(value),
    "Enter a valid Philippine mobile number.",
  )
  .transform((value) => `+63${value}`);
export const codeSchema = z
  .string()
  .regex(/^[0-9]{6}$/, "Enter the 6-digit verification code.");
