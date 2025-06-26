import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useSidebar } from "@/contexts/SidebarContext";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const { isOpen } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - rendered conditionally */}
      <Sidebar />
      
      {/* Main content - always takes remaining space */}
      <main className="flex-1 overflow-auto">
        <Header title={title} />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
