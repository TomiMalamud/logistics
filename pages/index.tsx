import React from 'react';
import useSWR from 'swr';
import Layout from '../components/Layout';
import Entrega, { EntregaProps } from '../components/Entrega';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Index: React.FC = () => {
  const { data, error } = useSWR('/api/feed', fetcher);

  if (error) return <div>Failed to load</div>;
  if (!data) return <div>Loading...</div>;

  const count = data.length;

  return (
    <Layout count={count}>
        {data.map((entrega: EntregaProps) => (
          <div className="py-4" key={entrega.id}>
            <Entrega entrega={entrega} />
          </div>
        ))}
    </Layout>
  );
};

export default Index;
