import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "684f82eae562a9a2686b2c24", 
  requiresAuth: true // Ensure authentication is required for all operations
});
