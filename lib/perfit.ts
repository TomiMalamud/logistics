// lib/perfit.ts
import { PerfitContact, PerfitResponse } from '@/types/types';

const PERFIT_BASE_URL = 'https://api.myperfit.com/v2';
const PERFIT_ACCOUNT = 'rohisommiers2';

if (!process.env.PERFIT_API_KEY) {
  throw new Error('PERFIT_API_KEY is not defined');
}

const perfitFetch = async <T>(
  endpoint: string,
  options: RequestInit
): Promise<T> => {
  const url = `${PERFIT_BASE_URL}/${PERFIT_ACCOUNT}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${process.env.PERFIT_API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error in Perfit API call');
    }

    return response.json();
  } catch (error) {
    console.error('Perfit API error:', error);
    throw error;
  }
};

export const createOrUpdateContact = async (
  contact: PerfitContact
): Promise<PerfitResponse> => {
  try {
    // First try to create the contact
    const result = await perfitFetch<PerfitResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });

    // If we got a contact ID back, update the existing contact
    if (result.data?.id) {
      return perfitFetch<PerfitResponse>(`/contacts/${result.data.id}`, {
        method: 'PUT',
        body: JSON.stringify(contact),
      });
    }

    return result;
  } catch (error) {
    console.error('Error creating/updating contact:', error);
    throw error;
  }
};

export const formatPerfitContact = (
  email: string,
  name: string,
): PerfitContact => {
  const [firstName, ...lastNameParts] = name.trim().split(' ');
  const lastName = lastNameParts.join(' ');

  return {
    email,
    firstName,
    lastName
  };
};