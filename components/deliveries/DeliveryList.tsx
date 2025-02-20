import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter } from "next/router";
import Delivery from "./Delivery";

interface FeedResponse {
  feed: any[];
  page: number;
  totalPages: number;
  totalItems: number;
}

interface DeliveryListProps {
  data: FeedResponse | undefined;
  searchUrl: string;
}

export default function DeliveryList({ data, searchUrl }: DeliveryListProps) {
  const router = useRouter();
  const currentPage = Number(router.query.page || 1);

  if (!data?.feed?.length) {
    return (
      <div className="py-8 text-center text-gray-500 animate-fade-in">
        No se encontraron resultados
      </div>
    );
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= data.totalPages) {
      router.push(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            page: newPage.toString(),
          },
        },
        undefined,
        { shallow: true }
      );
    }
  };

  // Generate array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPages = data.totalPages;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of visible page range
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust range if at the start or end
      if (currentPage <= 2) {
        end = 4;
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }

      // Add ellipsis if needed
      if (start > 2) {
        pages.push("ellipsis");
      }

      // Add visible page range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {data.feed.map((delivery: any, index: number) => (
          <div
            key={delivery.id}
            className="opacity-0 animate-[fade-in_0.5s_ease-out_forwards]"
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div
              className="py-2 animate-[slide-up_0.5s_ease-out_forwards]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Delivery delivery={delivery} fetchURL={searchUrl} />
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-up {
          from {
            transform: translateY(20px);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
      <Pagination
        className="opacity-0 animate-[fade-in_0.5s_ease-out_forwards]"
        style={{ animationDelay: `${data.feed.length * 100}ms` }}
      >
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => handlePageChange(currentPage - 1)}
            />
          </PaginationItem>
          {getPageNumbers().map((pageNum, index) =>
            pageNum === "ellipsis" ? (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={pageNum}>
                <PaginationLink
                  onClick={() => handlePageChange(pageNum as number)}
                  isActive={currentPage === pageNum}
                  className="cursor-pointer"
                >
                  {pageNum}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

DeliveryList.displayName = "DeliveryList";
