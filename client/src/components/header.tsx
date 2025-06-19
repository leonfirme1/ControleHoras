import { Button } from "@/components/ui/button";
import { Plus, UserCircle, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/App";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleNewEntry = () => {
    setLocation("/time-entries");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        <div className="flex items-center space-x-4">
          <Button onClick={handleNewEntry} className="bg-primary hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Lançamento
          </Button>
          <div className="flex items-center space-x-2">
            <UserCircle className="h-8 w-8 text-gray-600" />
            <span className="text-sm text-gray-600">{user?.name || "Usuário"}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-600 hover:text-gray-800"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
