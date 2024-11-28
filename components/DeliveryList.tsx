import { memo } from "react";
import Delivery from "./Delivery";

interface FeedResponse {
    feed: any[];
    page: number;
    totalPages: number;
    totalItems: number;
  }
  
// First, let's create a separate DeliveryList component
const DeliveryList: React.FC<{ 
    data: FeedResponse | undefined;
    searchUrl: string;
  }> = memo(({ data, searchUrl }) => {
    if (!data?.feed?.length) {
      return (
        <div className="py-4 text-center text-gray-500">
          No se encontraron resultados
        </div>
      );
    }
  
    return (
      <>
        {data.feed.map((delivery: any) => (
          <div className="py-2" key={delivery.id}>
            <Delivery delivery={delivery} fetchURL={searchUrl} />
          </div>
        ))}
      </>
    );
  });
  
  DeliveryList.displayName = 'DeliveryList';


export default DeliveryList;