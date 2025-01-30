"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { capitalizeString } from "@/lib/utils";
import { usePathname } from "next/navigation";

const MeetingsBreadcrumb = () => {
  const path = usePathname();
  const subPaths = path.split("/").splice(1);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {subPaths.map((path, idx) => (
          <BreadcrumbItem key={path} className="hidden md:block">
            {idx === subPaths.length - 1 ? (
              <BreadcrumbPage>{capitalizeString(path)}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink href={path}>
                  {capitalizeString(path)}
                </BreadcrumbLink>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default MeetingsBreadcrumb;
