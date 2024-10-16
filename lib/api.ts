// lib/api.ts

import {
  TokenResponse,
  Customer,
  GetClientByIdResponse,
  Comprobante,
  SearchComprobanteResponse,
} from '../types/api';

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

  if (
    tokenCache.access_token &&
    tokenCache.expires_at &&
    tokenCache.expires_at > currentTime
  ) {
    return tokenCache.access_token;
  }

  const tokenData = await fetchAccessToken();
  tokenCache.access_token = tokenData.access_token;
  tokenCache.expires_at = currentTime + tokenData.expires_in;

  return tokenData.access_token;
};

/**
 * Internal function to search comprobantes for a specific page.
 */
const _searchComprobantes = async (
  fechaDesde: string,
  fechaHasta: string,
  filtro?: string,
  page: number = 1
): Promise<SearchComprobanteResponse> => {
  const token = await getAccessToken();

  const url = new URL(`${API_URL_BASE}/api/comprobantes/search`);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('fechaDesde', fechaDesde);
  url.searchParams.append('fechaHasta', fechaHasta);
  if (filtro) {
    url.searchParams.append('filtro', filtro);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error searching comprobantes');
  }

  const data: SearchComprobanteResponse = await response.json();
  return data;
};

/**
 * Fetches all comprobantes across all pages.
 */
const fetchAllComprobantes = async (
  fechaDesde: string,
  fechaHasta: string,
  filtro?: string
): Promise<Comprobante[]> => {
  const allItems: Comprobante[] = [];
  let page = 1;
  let totalPages = 1; // Initialize to enter the loop

  while (page <= totalPages) {
    try {
      const response = await _searchComprobantes(fechaDesde, fechaHasta, filtro, page);
      allItems.push(...response.Items);

      // Calculate total pages based on TotalItems and items per page
      // Assuming the API returns a 'pageSize' parameter or similar.
      const pageSize = response.Items.length; // Adjust if API provides page size
      if (pageSize === 0) break; // No more items

      totalPages = Math.ceil(response.TotalItems / pageSize);
      page++;
    } catch (error: any) {
      console.error(`Error fetching page ${page}:`, error);
      throw error;
    }
  }

  return allItems;
};

/**
 * Fetches comprobantes using the search endpoint with retry logic on unauthorized errors.
 * This function fetches all pages and sorts the items by FechaAlta descending.
 */
export const searchComprobantes = async (filtro?: string): Promise<SearchComprobanteResponse> => {
  const fechaDesde = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const fechaHasta = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  try {
    const allItems = await fetchAllComprobantes(fechaDesde, fechaHasta, filtro);

    // Sort the accumulated items by FechaAlta descending (most recent first)
    const sortedItems = allItems.sort((a, b) => {
      const dateA = new Date(a.FechaAlta).getTime();
      const dateB = new Date(b.FechaAlta).getTime();
      return dateB - dateA;
    });

    return {
      Items: sortedItems,
      TotalItems: sortedItems.length,
      TotalPage: 1, // Since all items are fetched and consolidated into a single page
    };
  } catch (error: any) {
    if (error.message.includes('401')) {
      // Unauthorized, possibly token expired
      // Reset token cache
      tokenCache = { access_token: null, expires_at: null };
      try {
        const allItems = await fetchAllComprobantes(fechaDesde, fechaHasta, filtro);

        // Sort the accumulated items by FechaAlta descending (most recent first)
        const sortedItems = allItems.sort((a, b) => {
          const dateA = new Date(a.FechaAlta).getTime();
          const dateB = new Date(b.FechaAlta).getTime();
          return dateB - dateA;
        });

        return {
          Items: sortedItems,
          TotalItems: sortedItems.length,
          TotalPage: 1, // Since all items are fetched and consolidated into a single page
        };
      } catch (retryError: any) {
        throw retryError;
      }
    }
    throw error;
  }
};

/**
 * Fetches a client by ID using the ERP's API.
 */
export const getClientById = async (id: number): Promise<Customer> => {
  const token = await getAccessToken();

  const url = `${API_URL_BASE}/api/clientes/${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error fetching client by ID:', errorData);
    throw new Error(errorData.message || 'Error fetching client by ID');
  }

  const data: Customer = await response.json();
  return data;
};

/**
 * **NEW FUNCTION**
 * Fetches a single comprobante by its ID.
 *
 * @param id - The ID of the comprobante to fetch.
 * @returns The Comprobante object.
 */
export const getComprobanteById = async (id: number): Promise<Comprobante> => {
  const token = await getAccessToken();

  const url = `${API_URL_BASE}/api/comprobantes/?id=${id}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error fetching comprobante by ID:', errorData);
    throw new Error(errorData.message || 'Error fetching comprobante by ID');
  }

  const data: Comprobante = await response.json();
  return data;
};
