// lib/api.ts

import { TokenResponse, Client, GetClientByDocResponse } from '../types/api';

const API_URL_BASE = process.env.NEXT_PUBLIC_API_URL_BASE as string;
const CLIENT_ID = process.env.CLIENT_ID as string;
const CLIENT_SECRET = process.env.CLIENT_SECRET as string;

// In-memory token cache
let tokenCache: {
  access_token: string | null;
  expires_at: number | null;
} = {
  access_token: null,
  expires_at: null,
};

/**
 * Fetches a new access token using client credentials.
 */
const fetchAccessToken = async (): Promise<TokenResponse> => {
  const response = await fetch(`${API_URL_BASE}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error fetching access token:', errorData);
    throw new Error('Unable to obtain access token');
  }

  const data: TokenResponse = await response.json();
  return data;
};

/**
 * Retrieves a valid access token, fetching a new one if necessary.
 */
export const getAccessToken = async (): Promise<string> => {
  const currentTime = Math.floor(Date.now() / 1000);

  if (tokenCache.access_token && tokenCache.expires_at && tokenCache.expires_at > currentTime) {
    return tokenCache.access_token;
  }

  const tokenData = await fetchAccessToken();
  tokenCache.access_token = tokenData.access_token;
  tokenCache.expires_at = currentTime + tokenData.expires_in;

  return tokenData.access_token;
};

/**
 * Internal function to fetch clients by document.
 */
const _fetchClientsByDoc = async (tipoDoc: string, nroDoc: string): Promise<GetClientByDocResponse> => {
  const token = await getAccessToken();

  const url = new URL(`${API_URL_BASE}/api/clientes/GetClientByDoc`);
  url.searchParams.append('tipoDoc', tipoDoc);
  url.searchParams.append('nroDoc', nroDoc);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error fetching clients by document');
  }

  const data: GetClientByDocResponse = await response.json();
  return data;
};

/**
 * Fetches clients by document with retry logic on unauthorized errors.
 */
export const fetchClientsByDoc = async (tipoDoc: string, nroDoc: string): Promise<GetClientByDocResponse> => {
  try {
    return await _fetchClientsByDoc(tipoDoc, nroDoc);
  } catch (error: any) {
    if (error.message.includes('401')) { // Unauthorized, possibly token expired
      // Reset token cache
      tokenCache = { access_token: null, expires_at: null };
      // Retry fetching clients by document
      return await _fetchClientsByDoc(tipoDoc, nroDoc);
    }
    throw error;
  }
};


/**
 * Internal function to search clients.
 */
const _searchClients = async (filter: string): Promise<GetClientByDocResponse> => {
  const token = await getAccessToken();

  const url = new URL(`${API_URL_BASE}/api/clientes/search`);
  url.searchParams.append('filtro', filter);
  url.searchParams.append('pageSize', '5'); // Set desired page size (up to 50 as per documentation)

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error searching clients');
  }

  const data: GetClientByDocResponse = await response.json();
  return data;
};

/**
 * Fetches clients using the search endpoint with retry logic on unauthorized errors.
 */
export const searchClients = async (filter: string): Promise<GetClientByDocResponse> => {
  try {
    return await _searchClients(filter);
  } catch (error: any) {
    if (error.message.includes('401')) { // Unauthorized, possibly token expired
      // Reset token cache
      tokenCache = { access_token: null, expires_at: null };
      // Retry searching clients
      return await _searchClients(filter);
    }
    throw error;
  }
};
