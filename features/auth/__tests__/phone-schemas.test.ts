import { phoneSchema, codeSchema } from "../phone-schemas";
test.each([
  "9171234567",
  "09171234567",
  "639171234567",
  "+639171234567",
  "0917 123 4567",
])("normalizes %s to E.164", (value) =>
  expect(phoneSchema.parse(value)).toBe("+639171234567"),
);
test.each([
  "",
  "8171234567",
  "+12025550123",
  "091712345678",
  "hello",
  "+63917<script>",
])("rejects invalid phone %s", (value) =>
  expect(phoneSchema.safeParse(value).success).toBe(false),
);
test("requires exactly six ASCII digits", () => {
  expect(codeSchema.parse("123456")).toBe("123456");
  for (const value of ["12345", "1234567", "１２３４５６", "123a56"])
    expect(codeSchema.safeParse(value).success).toBe(false);
});
