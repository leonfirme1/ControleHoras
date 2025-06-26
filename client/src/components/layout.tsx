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
      {/* Sidebar container - only shows when open */}
      {isOpen && <Sidebar />}
      
      {/* Main content - takes full width when sidebar is closed */}
      <main className={`
        flex-1 overflow-auto transition-all duration-300 ease-in-out
        ${isOpen ? '' : 'ml-0'}
      `}>
        <Header title={title} />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
