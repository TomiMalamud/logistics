import { useState, useEffect } from "react";
import { Client, GetClientByDocResponse } from "../types/api";

const SearchClient: React.FC = () => {
  const [filtro, setFiltro] = useState<string>("20393275163");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setClients([]);

    try {
      const response = await fetch(`/api/search-client?filtro=${filtro}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data: GetClientByDocResponse = await response.json();
      console.log("API Response:", data);

      setClients(data.clients || []);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Updated clients:", clients);
  }, [clients]);

  return (
    <div>
      <h2>Search Clients</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="filtro">Filtro:</label>
          <input
            type="text"
            id="filtro"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {clients.length > 0 && (
        <div>
          <ul>
            {clients.map((client) => (
              <li key={client.Id}>
                <strong>ID:</strong> {client.Id} | <strong>TipoDoc:</strong>{" "}
                {client.TipoDoc} | <strong>NroDoc:</strong> {client.NroDoc} |{" "}
                <strong>Nombre:</strong> {client.RazonSocial}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchClient;
