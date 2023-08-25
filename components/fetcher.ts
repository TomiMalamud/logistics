const fetcher = (url: string) => {
    const promise = fetch(url).then((res) => res.json());
    let status: "pending" | "success" | "error" = "pending";
    let result: any;
    let suspender = promise.then(
      (data) => {
        status = "success";
        result = data;
      },
      (error) => {
        status = "error";
        result = error;
      }
    );
    return {
      read() {
        if (status === "pending") {
          throw suspender;
        } else if (status === "error") {
          throw result;
        } else if (status === "success") {
          return result;
        }
      },
    };
  };
  
  export default fetcher;
  