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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar with slide animation */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0'}`}>
        <Sidebar />
      </div>
      
      {/* Main content with smooth transition */}
      <main className="flex-1 overflow-auto transition-all duration-300 ease-in-out">
        <Header title={title} />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
