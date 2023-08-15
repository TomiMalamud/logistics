import React, { useState } from 'react';
import Layout from '../components/Layout';
import Router from 'next/router';

const Create: React.FC = () => {
  const [punto_venta, setPunto_venta] = useState('');
  const [fecha, setFecha] = useState('');
  const [producto, setProducto] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [nombre, setNombre] = useState('');
  const [celular, setCelular] = useState('');
  const [notas, setNotas] = useState('');
  const [celularError, setCelularError] = useState('');

  const validateCelular = (value: string) => {
    const celularRegex = /^\d{10}$/;
    return celularRegex.test(value);
  };
  const submitData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      if (!validateCelular(celular)) {
        // Show an error message or handle the invalid celular format
        setCelularError('Formato válido: 3541614107. Sin 0 ni 15, sin espacios ni guiones.');
        return;
      }

      const body = { punto_venta, fecha, producto, domicilio, nombre, celular, notas };
      await fetch('/api/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      await Router.push('/');
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <Layout>
      <main className="relative flex min-h-screen flex-col items-center justify-center">
        <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
          <form onSubmit={submitData}>
            <div className="space-y-12">
              <div className="border-b border-gray-900/10 pb-12">
                <h2 className="font-semibold leading-7 mb-4 text-xl text-gray-900">Nueva entrega</h2>
                <label className="block text-sm font-medium leading-6 text-gray-500">
                  Punto de Venta
                </label>
                <input
                  autoFocus
                  onChange={(e) => setPunto_venta(e.target.value)}
                  placeholder="Punto de Venta"
                  type="text"
                  value={punto_venta}
                  className="block w-full rounded-md border-0 p-2 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <label className="block text-sm font-medium leading-6 text-gray-500">
                  Fecha de venta
                </label>
                <input
                  onChange={(e) => setFecha(`${e.target.value}T00:00:00Z`)}
                  type='date'
                  placeholder="Fecha"
                  value={fecha.slice(0, 10)}
                  className="block w-full rounded-md border-0 px-2 pt-2 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <label className="block text-sm font-medium leading-6 text-gray-500">
                  Producto
                </label>
                <input
                  onChange={(e) => setProducto(e.target.value)}
                  placeholder="Euro 2x2 + bases + Almohadas"
                  value={producto}
                  className="block w-full rounded-md border-0 p-2 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <label className="block text-sm font-medium leading-6 text-gray-500">
                  Domicilio
                </label>
                <input
                  onChange={(e) => setDomicilio(e.target.value)}
                  placeholder="9 de Julio 322"
                  value={domicilio}
                  className="block w-full rounded-md border-0 p-2 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <label className="block text-sm font-medium leading-6 text-gray-500">
                  Nombre
                </label>
                <input
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  value={nombre}
                  className="block w-full rounded-md border-0 p-2 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <label className="block text-sm font-medium leading-6 text-gray-500">
                  Celular
                </label>
                <input
                  onChange={(e) => setCelular(e.target.value)}
                  placeholder="3541614107"
                  value={celular}
                  className="block w-full rounded-md border-0 p-2 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />       {celularError && (
                  <p className="text-sm text-red-500">{celularError}</p>
                )}
                <label className="block text-sm font-medium leading-6 text-gray-500">
                  Notas
                </label>
                <input
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Agregar fecha de entrega estimada"
                  value={notas}
                  className="block w-full rounded-md border-0 p-2 my-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <div className="mt-6 flex items-center justify-end gap-x-6">
                  <button type="button" className="text-sm font-semibold leading-6 text-gray-900" onClick={() => Router.push('/')}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" value="Create"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </Layout>
  );
};

export default Create;
