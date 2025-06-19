import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header title={title} />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
