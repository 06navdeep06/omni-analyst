
## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   - Create a `.env.local` file based on `.env.example` (or use the provided script).
   - Get your API keys from:
     - [Supabase Dashboard](https://supabase.com/dashboard) (Project Settings -> API)
     - [Fireworks AI](https://fireworks.ai/api-keys)

3. **Automated Setup**:
   Run the setup script to configure your database and storage automatically:
   ```bash
   npm run setup
   ```
   Follow the prompts to enter your Supabase URL, Anon Key, Service Role Key, and DB Password.

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Features

- **Dashboard**: Upload files (PDF, CSV, Images) or paste URLs.
- **Analysis**: Uses Fireworks AI (kimi-k2p5) to generate summaries and insights.
- **Reports**: View past analysis reports.
- **Chat**: Ask questions about your data using AI.
- **Authentication**: Secure login via Supabase Auth.
