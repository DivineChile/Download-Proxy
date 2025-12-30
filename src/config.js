import "dotenv/config";

export const PORT = process.env.PORT || 4000;
export const TOKEN_SECRET = process.env.TOKEN_SECRET;

if (!TOKEN_SECRET) {
  throw new Error("TOKEN_SECRET is required in .env");
}
