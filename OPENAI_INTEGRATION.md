# OpenAI Integration

BigStepLabs now uses real OpenAI API calls for all chat interactions with AI agents. The simulation system has been completely removed.

## Setup

1. **Get an OpenAI API Key**
   - Sign up at [OpenAI Platform](https://platform.openai.com/)
   - Create an API key in your account settings
   - Copy the API key

2. **Configure Environment**
   - Add your API key to `.env`:
   ```bash
   VITE_OPENAI_API_KEY=your-actual-openai-api-key
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

## How It Works

### Agent Configuration
Each agent uses:
- **Persona System Prompt**: Defines the AI's behavior and teaching style
- **Agent Description**: Specifies the agent's role and capabilities  
- **Linked Datasets**: Provides knowledge context for responses
- **Model Configuration**: Sets temperature, max tokens, and model type

### Chat Flow
1. User sends a message
2. System builds context from agent's persona, description, and datasets
3. OpenAI API is called with the full conversation history
4. Response is saved to database and displayed in chat
5. Conversation continues with full context

### Status Indicators
- **Green dot**: OpenAI API is configured and working
- **Red dot**: No API key configured

## Error Handling

If the OpenAI API fails:
- Clear error messages are displayed to the user
- Detailed error logs are shown in the browser console
- Common issues include:
  - Invalid API key
  - Rate limiting
  - Network connectivity issues

## Cost Management

- Each message uses tokens based on conversation length
- Monitor usage in your OpenAI dashboard
- Consider setting usage limits in your OpenAI account

## Testing

To test the integration:
1. Set up your API key
2. Create an agent with a persona
3. Start a chat session
4. Send messages and verify real AI responses

The chat interface will show a green dot when OpenAI is properly configured. 