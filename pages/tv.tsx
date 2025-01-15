import DisplayController from "@/components/DisplayController";
import type { NextPage } from "next";
import Head from "next/head";

const DisplayPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>ROHI Sommiers - Display Controller</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="ROHI Sommiers display controller" />
      </Head>
      <DisplayController />
    </>
  );
};

export default DisplayPage;
