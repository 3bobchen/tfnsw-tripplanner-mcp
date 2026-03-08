import dotenv from "dotenv";

dotenv.config();

export const TFNSW_API_KEY = process.env.TFNSW_API_KEY;

if (!TFNSW_API_KEY) {
  console.error(
    "Error: TFNSW_API_KEY environment variable is required.\n" +
      "Get a free API key from https://opendata.transport.nsw.gov.au/\n" +
      "Then set it via:\n" +
      "  - Environment variable: export TFNSW_API_KEY=your_key\n" +
      "  - .env file: TFNSW_API_KEY=your_key"
  );
  process.exit(1);
}
