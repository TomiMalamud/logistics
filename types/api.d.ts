export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// Define the Client interface based on ERP API response
export interface Client {
  Id: number;
  RazonSocial: string;
  NombreFantasia: string;
  CondicionIva: string;
  TipoDoc: string;
  NroDoc: string;
  Pais?: string;
  Provincia?: string;
  Ciudad?: string;
  Domicilio?: string;
  Telefono?: string;
  Email?: string;
  Codigo?: string;
  PisoDepto?: string;
  Cp?: string;
  Observaciones?: string;
  Personeria?: string;
  IdPais?: number;
  IdProvincia?: number;
  IdCiudad?: number;
  IdListaPrecio?: number | null;
}

// If the API returns a list of clients
export interface GetClientByDocResponse {
  clients: Client[];
  total: number;
}
