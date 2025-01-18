// utils/pagination.ts
export function getPageNumbers(currentPage: number, totalPages: number) {
    const pages = [];
    const maxVisiblePages = 5;
  
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
  
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
  
      if (currentPage <= 2) {
        end = 4;
      }
      if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
  
      if (start > 2) {
        pages.push("ellipsis");
      }
  
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
  
      if (end < totalPages - 1) {
        pages.push("ellipsis");
      }
  
      pages.push(totalPages);
    }
    return pages;
  }